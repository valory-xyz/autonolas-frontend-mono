import { Typography } from 'antd';
import styled from 'styled-components';
import { PageWrapper } from 'util/theme';

const { Title, Paragraph } = Typography;

const MonetizeContainer = styled.div`
  padding-bottom: 24px;
  max-width: 1400px;
  margin: auto;
  ol.lower-alpha {
    list-style-type: lower-alpha;
  }
`;

export const MonetizeYourAgent = () => (
  <PageWrapper>
    <MonetizeContainer>
      <Title level={2} className="mt-0">
        Monetize Your Agent
      </Title>
      <Paragraph style={{ maxWidth: 550 }}>
        Prerequisites: <br />
        Python &gt;=3.10, Poetry &gt;=1.4.0 && &lt;2.x, Tendermint ==0.34.19, Docker
      </Paragraph>
      <Paragraph>
        <div style={{ paddingBottom: 12 }}>
          Get started with monetizing your agent in three easy steps:
        </div>
        <ol>
          <li>
            Install agent framework
            <ol className="lower-alpha">
              <li>
                git clone{' '}
                <a
                  href="https://github.com/valory-xyz/mech-tools-dev.git"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/valory-xyz/mech-tools-dev.git
                </a>{' '}
                && cd mech-tools-dev
              </li>
              <li>poetry shell && poetry install</li>
              <li>autonomy packages sync --update-packages</li>
            </ol>
          </li>
          <li>
            Configure your agent
            <ol className="lower-alpha">
              <li>python utils/configure_and_deploy.py</li>
            </ol>
          </li>
          <li>
            Run your agent
            <ol className="lower-alpha">
              <li>bash run_service.sh</li>
            </ol>
          </li>
        </ol>
      </Paragraph>
    </MonetizeContainer>
  </PageWrapper>
);
