import { Flex, Typography } from 'antd';
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
      <Flex justify="space-between">
        {olasItems.map(({ label, description, link }) => (
          <a href={link} key={label}>
            <DocsCard className="what-is-olas-card">
              <Text className="mb-4" style={{ fontWeight: 500 }}>
                {label}
              </Text>
              <br />
              <Text style={{ fontSize: 14, color: COLOR.SECONDARY }}>{description}</Text>
            </DocsCard>
          </a>
        ))}
      </Flex>
    </div>
  </ContentWrapper>
);
