import { Button, Col, Row, Typography } from 'antd';
import Image from 'next/image';
import Link from 'next/link';

import { useHelpers } from 'common-util/hooks/useHelpers';
import { useScreen } from 'common-util/hooks/useScreen';

import { AutonolasServicesArchitected } from './AutonolasServicesArchitected';
import { Container, HeaderRow } from './styles';

const { Title, Text } = Typography;

// TODO: this page is deprecated, @oaksprout will update it
const IS_DEPRECATED = true;

const HomePage = () => {
  const { isL1Network, links } = useHelpers();
  const { isMobile } = useScreen();

  if (IS_DEPRECATED) return null;

  return (
    <Container>
      <HeaderRow className="row-1">
        <Row>
          <Col span={14} offset={2}>
            <Title className="hero-title">
              {` Mint and manage your services${isL1Network ? ', agents and components' : ''}.`}
            </Title>
            <Text className="lead">
              The easiest way to interact with the Autonolas on-chain registry.
            </Text>
            <Link href={isL1Network ? links.COMPONENTS : links.SERVICES} passHref legacyBehavior>
              <Button size="large" type="primary">
                Get started →
              </Button>
            </Link>
          </Col>
          <Col span={8}>
            <Image
              src="/images/homepage/autonomous-agent-service-architecture.svg"
              width={isMobile ? 120 : 344}
              height={isMobile ? 120 : 344}
              fetchPriority="high"
              alt="Autonomous Agent Service Architecture"
            />
          </Col>
        </Row>
      </HeaderRow>

      <AutonolasServicesArchitected />
    </Container>
  );
};

export default HomePage;
