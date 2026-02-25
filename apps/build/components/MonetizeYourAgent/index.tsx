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
    title: '1. Setup your workspace',
    description: 'Run the setup command to create the workspace and deploy the mech on-chain:',
    codeBlocks: ['poetry run mech setup -c <chain>'],
  },
  {
    title: '2. Scaffold a tool',
    description: 'Create a new tool using the CLI:',
    codeBlocks: ['poetry run mech add-tool <author> <tool_name> -d "Tool description"'],
  },
  {
    title: '3.Implement your tool logic',
    description: (
      <>
        Write your implementation in{' '}
        <Text code>
          ~/.operate-mech/packages/&lt;author&gt;/customs/&lt;tool_name&gt;/&lt;tool_name&gt;.py
        </Text>
        . The scaffold provides a template with a <Text code>run()</Text> function you fill in.
        <blockquote>
          <Text strong>Note:</Text> If your tool requires API keys or other secrets, add them to{' '}
          <Text code>~/.operate-mech/.env</Text>.
        </blockquote>
      </>
    ),
  },
  {
    title: '4. Publish metadata',
    description: 'Generate metadata, push to IPFS, and update on-chain:',
    codeBlocks: ['poetry run mech prepare-metadata', 'poetry run mech update-metadata -c <chain>'],
  },
  {
    title: '5. Launch the agent',
    description: 'Start the mech service:',
    codeBlocks: ['poetry run mech run -c <chain>'],
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
          {item.description && <Paragraph>{item.description}</Paragraph>}
          <div>
            {item.codeBlocks &&
              item.codeBlocks.map((block, index) => (
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
