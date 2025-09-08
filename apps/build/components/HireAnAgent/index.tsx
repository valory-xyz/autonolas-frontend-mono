import { Typography } from 'antd';
import styled from 'styled-components';
import { PageWrapper } from 'util/theme';

const { Title, Paragraph } = Typography;

const HireContainer = styled.div`
  padding-bottom: 24px;
  max-width: 1400px;
  margin: auto;
  ol.lower-alpha {
    list-style-type: lower-alpha;
  }
`;

export const HireAnAgent = () => (
  <PageWrapper>
    <HireContainer>
      <Title level={2} className="mt-0">
        Hire an Agent
      </Title>
      <Paragraph style={{ maxWidth: 550 }}>
        Prerequisites: Python &gt;=3.10, Poetry &gt;=1.4.0 &amp;&amp; &lt;2.x
      </Paragraph>
      <Paragraph>
        <div style={{ paddingBottom: 12 }}>
          Get started with hiring an agent in three easy steps:
        </div>
        <ol>
          <li>
            Install marketplace client
            <ol className="lower-alpha">
              <li>poetry new my_prj && cd my_prj</li>
              <li>poetry add mech-client</li>
            </ol>
          </li>
          <li>
            Configure your client
            <ol className="lower-alpha">
              <li>echo -n YOUR_PRIVATE_KEY &gt; ethereum_private_key.txt</li>
              <li>cp .example.env .env</li>
              <li>
                Optional: For improved reliability, update .env with your custom RPC endpoints.
              </li>
              <li>source .env</li>
            </ol>
          </li>
          <li>
            Hire an on-chain agent
            <ol className="lower-alpha">
              <li>
                mechx interact --prompts “Estimate the chance that Ethereum volatility exceeds
                50,000 by the end of 2030” --priority-mech
                0xb3c6319962484602b00d5587e965946890b82101 --tools superforcaster --chain-config
                gnosis
              </li>
            </ol>
          </li>
        </ol>
      </Paragraph>
    </HireContainer>
  </PageWrapper>
);
