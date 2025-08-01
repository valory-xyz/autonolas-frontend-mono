import { Anchor, Grid, Typography } from 'antd';
import { get } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { CoreConcepts } from './content/CoreConcepts';
import { HowItWorks } from './content/HowItWorks';
import { QuickStart } from './content/QuickStart';
import { Overview } from './content/Overview';
import { HowToProposeAPost } from './content/HowToProposeAPost';
import { HowToUseOlasContribute } from './content/HowToUseOlasContribute';
import { DOC_NAV, NavWrapper } from './helpers';
import { Container, DocSection } from './styles';
import { FAQs } from './content/FAQs';

const { Title } = Typography;
const { Link } = Anchor;
const { useBreakpoint } = Grid;

export const Documentation = () => {
  const [activeNav, setActiveNav] = useState<string | null>(null);
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
  }, [router]);

  return (
    <Container>
      <Title>Docs</Title>

      <DocSection isMobile={isMobile}>
        <NavWrapper isMobile={isMobile}>
          <div className="navigation-section">
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
          <QuickStart />
          <CoreConcepts />
          <HowToUseOlasContribute />
          <HowToProposeAPost />
          <HowItWorks />
          <FAQs />
        </div>
      </DocSection>
      <br />
      <br />
      <br />
    </Container>
  );
};
