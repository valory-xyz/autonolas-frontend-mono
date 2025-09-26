import { Col, Row, Typography } from 'antd';
import { SITE_URL } from '@autonolas-frontend-mono/util-constants';
import { ContentWrapper, DocsCard } from '../Layout/styles';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';

const { Title, Paragraph, Text } = Typography;

const olasItems = [
  {
    label: 'About Olas',
    description: "Understand Olas' mission.",
    link: `${SITE_URL}/about`,
  },
  {
    label: 'Roadmap',
    description: "Discover what's next.",
    link: `${SITE_URL}/roadmap`,
  },
  {
    label: 'Timeline',
    description: 'The story so far.',
    link: `${SITE_URL}/timeline`,
  },
];

export const WhatIsOlas = () => (
  <ContentWrapper>
    <Title level={3} className="mb-12">
      What is Olas?
    </Title>
    <Paragraph className="mb-32">
      Olas is the platform that enables true co-ownership of AI.
    </Paragraph>
    <div>
      <Row gutter={[24, 24]}>
        {olasItems.map(({ label, description, link }) => (
          <Col key={label} xs={24} sm={12} md={8}>
            <a href={link}>
              <DocsCard className="what-is-olas-card">
                <Text className="mb-4" style={{ fontWeight: 500 }}>
                  {label}
                </Text>
                <br />
                <Text style={{ fontSize: 14, color: COLOR.SECONDARY }}>{description}</Text>
              </DocsCard>
            </a>
          </Col>
        ))}
      </Row>
    </div>
  </ContentWrapper>
);
