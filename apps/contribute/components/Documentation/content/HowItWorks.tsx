import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

export const HowItWorks = () => (
  <div id={DOCS_SECTIONS['how-it-works']}>
    <Title level={2}>Advanced: How It Works</Title>

    <Paragraph>
      <ul>
        <li>
          Olas Contribute runs on a decentralized agent, automating:
          <ul>
            <li>Action processing</li>
            <li>Points aggregation</li>
            <li>Staking KPI Progress Calculation</li>
            <li>Post approvals based on on-chain votes</li>
          </ul>
        </li>
      </ul>
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
