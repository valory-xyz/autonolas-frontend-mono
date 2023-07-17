import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Anchor, Typography, Grid } from 'antd/lib';
import { get } from 'lodash';
import Overview from './content/1_Overview';
import Badge from './content/3_Badge';
import Leaderboard from './content/4_Leaderboard';
import HowItWorks from './content/5_HowItWorks';
import { DOC_NAV, NavWrapper } from './helpers';
import { Container, DocSection } from './styles';
import ActionsDocs from './content/2_Actions';

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
    offsetTop: isMobile ? 20 : 60,
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
          <Overview />
          <ActionsDocs />
          <Badge />
          <Leaderboard />
          <HowItWorks />
        </div>
      </DocSection>
      <br />
      <br />
      <br />
    </Container>
  );
};

export default Documentation;
