import { Alert, Button, Flex, Typography } from 'antd';
import { CodeBlock } from 'components/CodeBlock';
import { STACK_URL } from 'libs/util-constants/src';
import styled from 'styled-components';
import { PageWrapper } from 'util/theme';

const { Title, Text, Paragraph } = Typography;

const HireContainer = styled.div`
  padding-bottom: 24px;
  max-width: 1400px;
  margin: auto;
  ol.lower-alpha {
    list-style-type: lower-alpha;
  }
`;

const Prerequisites = () => (
  <div>
    <Title level={4}>Prerequisites</Title>
    <CodeBlock>Python &gt;=3.10</CodeBlock>
    <CodeBlock>Poetry &gt;=1.4.0 && &lt;2.x</CodeBlock>
  </div>
);

const quickstartItems = [
  {
    title: '1. Install Marketplace Client',
    codeBlocks: ['poetry new my_prj && cd my_prj', 'poetry add mech-client'],
  },
  {
    title: '2. Configure Your Client',
    codeBlocks: ['echo -n YOUR_PRIVATE_KEY > ethereum_private_key.txt', 'touch .env'],
    moreItems: (
      <>
        <Paragraph>Then set the following environment variables:</Paragraph>
        <CodeBlock canCopy>export MECHX_CHAIN_RPC='https://rpc.eu-central-2.gateway.fm/v4/gnosis/non-archival/mainnet'</CodeBlock>
        <Paragraph>
          Optional: For improved reliability, update .env with your custom RPC endpoint.
        </Paragraph>
        <CodeBlock canCopy>source .env</CodeBlock>
      </>
    ),
  },
  {
    title: '3. Hire On-chain Agent',
    codeBlocks: [
      'poetry run mechx setup-agent-mode --chain-config gnosis',
      'poetry run mechx interact --prompts "Estimate the chance that Ethereum volatility exceeds 50,000 by the end of 2030" --priority-mech 0xb3c6319962484602b00d5587e965946890b82101 --tools superforcaster --chain-config gnosis',
    ],
  },
];

const Quickstart = () => (
  <Flex gap={24} vertical>
    <div>
      <Title level={4}>Quickstart</Title>
      <Text>Get started with hiring an agent in three easy steps:</Text>
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
            {item.moreItems}
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
      <a href={`${STACK_URL}/mech-client/`}>Explore Documentation</a>
    </Button>
  </>
);

export const HireAnAgent = () => (
  <PageWrapper>
    <HireContainer>
      <Title level={2} className="mb-0">
        Hire an Agent on Olas Marketplace
      </Title>
      <Prerequisites />
      <Quickstart />
      <Alert message={AlertMessage} type="info" showIcon />
    </HireContainer>
  </PageWrapper>
);
