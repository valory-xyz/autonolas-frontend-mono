import { Alert, Button, Flex, Typography } from 'antd';
import { CodeBlock } from 'components/CodeBlock';
import { STACK_URL } from 'libs/util-constants/src';
import styled from 'styled-components';
import { PageWrapper } from 'util/theme';

const { Title, Paragraph, Text } = Typography;

const MonetizeContainer = styled.div`
  padding-bottom: 24px;
  max-width: 1400px;
  margin: auto;
  ol.lower-alpha {
    list-style-type: lower-alpha;
  }
`;

const prerequisiteItems = [
  'Python >=3.10',
  'Poetry >=1.4.0 && <2.x',
  'Tendermint == 0.34.19',
  'Docker',
];

const Prerequisites = () => (
  <div>
    <Title level={4} className="mb-16">
      Prerequisites
    </Title>
    {prerequisiteItems.map((item) => (
      <CodeBlock key={item}>{item}</CodeBlock>
    ))}
  </div>
);

const quickstartItems = [
  {
    title: '1. Install Agent Framework',
    codeBlocks: [
      'git clone https://github.com/valory-xyz/mech-tools-dev.git && cd mech-tools-dev',
      'poetry shell && poetry install',
      'autonomy packages sync --update-packages',
    ],
  },
  {
    title: '2. Configure Your Agent',
    codeBlocks: ['python utils/configure_and_deploy.py'],
  },
  {
    title: '3. Run Your Agent',
    codeBlocks: ['bash run_service.sh'],
  },
];

const Quickstart = () => (
  <Flex gap={24} vertical>
    <div>
      <Title level={4}>Quickstart</Title>
      <Text>Get started with monetizing your agent in three easy steps:</Text>
    </div>
    <Flex vertical>
      {quickstartItems.map((item) => (
        <div key={item.title} className="mb-20">
          <Paragraph>
            <Text strong>{item.title}</Text>
          </Paragraph>
          <div>
            {item.codeBlocks.map((block, index) => (
              <CodeBlock key={`${item.title}${index}`} canCopy>
                {block}
              </CodeBlock>
            ))}
          </div>
        </div>
      ))}
    </Flex>
  </Flex>
);

const AlertMessage = (
  <>
    <p className="mt-0">
      This quickstart covers the basics. For full details and advanced options, see the Olas Stack
      Documentation.
    </p>
    <Button type="default" size="large">
      <a href={`${STACK_URL}/mech-tools-dev/`}>Explore Documentation</a>
    </Button>
  </>
);

export const MonetizeYourAgent = () => (
  <PageWrapper>
    <MonetizeContainer>
      <Title level={2} className="mt-0">
        Monetize Your Agent
      </Title>
      <Prerequisites />
      <Quickstart />
      <Alert message={AlertMessage} type="info" showIcon />
    </MonetizeContainer>
  </PageWrapper>
);
