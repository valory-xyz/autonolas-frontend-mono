import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

export const HowToUseOlasContribute = () => (
  <div id={DOCS_SECTIONS['how-to-use']}>
    <Title level={2}>Post</Title>
    <Paragraph>
      <ul>
        <li>Complete actions to earn points.</li>
        <li>Climb the leaderboard by contributing regularly.</li>
        <li>
          Stake in one of the available contracts to become eligible for earning OLAS rewards
          through your contributions.
        </li>
      </ul>
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
