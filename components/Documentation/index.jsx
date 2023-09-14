import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Anchor, Typography } from 'antd';
import { get } from 'lodash';
import { useScreen } from 'common-util/hooks';
import Overview from './content/1_OffChainAgent';
import Badge from './content/3_HighLevelSpec';
import { DOC_NAV, NavWrapper } from './helpers';
import ActionsDocs from './content/2_OnChainProtocol';
import { Container, DocSection } from './styles';

const { Title } = Typography;

const Documentation = () => {
  const [activeNav, setActiveNav] = useState(null);
  const router = useRouter();
  const { isMobile } = useScreen();
  const anchorCommonProps = {
    affix: false,
    offsetTop: isMobile ? 20 : 100,
  };

  useEffect(() => {
    const { asPath } = router;
    const afterHash = asPath.split('#')[1];
    setActiveNav(afterHash || get(DOC_NAV, `[${0}].id`) || '');
  }, []);

  return (
    <Container>
      <DocSection isMobile={isMobile}>
        <NavWrapper isMobile={isMobile}>
          <div className="navigation-section">
            <Title>Docs</Title>
            <Anchor
              {...anchorCommonProps}
              getCurrentAnchor={() => activeNav}
              onChange={(key) => setActiveNav(key)}
              items={DOC_NAV.map(({ id: key, title }) => ({
                key,
                title,
                href: `#${key}`,
              }))}
            />
          </div>
        </NavWrapper>

        <div className="reading-section">
          <Title level={2}>Overview of AI Mech Architecture</Title>
          <Overview />
          <ActionsDocs />
          <Badge />
        </div>
      </DocSection>
      <br />
      <br />
      <br />
    </Container>
  );
};

export default Documentation;
