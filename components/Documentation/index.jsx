import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Anchor, Typography, Grid } from 'antd/lib';
import { get } from 'lodash';
import Overview from './content/1_OffChainAgent';
import Badge from './content/3_HighLevelSpec';
import { DOC_NAV, NavWrapper } from './helpers';
import ActionsDocs from './content/2_OnChainProtocol';
import { Container, DocSection } from './styles';

const { Title } = Typography;
const { Link } = Anchor;
const { useBreakpoint } = Grid;

const Documentation = () => {
  const [activeNav, setActiveNav] = useState(null);
  const router = useRouter();
  const screens = useBreakpoint();
  const isMobile = !!screens.xs;
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
            {DOC_NAV.map(({ id: key, title }) => (
              <Anchor
                {...anchorCommonProps}
                key={key}
                className={`custom-nav-anchor ${
                  key === activeNav ? 'custom-nav-anchor-active' : ''
                }`}
                onClick={() => setActiveNav(key)}
              >
                <Link href={`#${key}`} title={title} />
              </Anchor>
            ))}
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
