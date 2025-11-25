import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Text, Paragraph } = Typography;

export const QuickStart = () => (
  <div id={DOCS_SECTIONS['quick-start']}>
    <Title level={2}>Quick Start</Title>
    <Paragraph>
      <Text strong>Get started in 5 minutes:</Text>
      <ol>
        <li>
          <Text strong>Connect your wallet</Text> on Olas Contribute.
        </li>
        <li>
          <Text strong>Complete your first action</Text> — for example, “Spread the word on X” via
          Connect X. Choose a campaign and make a tweet.
          {/* <ul>
            <li>
              There are two types of actions:
              <ul>
                <li>
                  <Text strong>Posting:</Text> Earns you points.
                </li>
                <li>
                  <Text strong>Proposing:</Text> You can suggest posts, but these do{' '}
                  <Text strong>not</Text> earn points.
                </li>
              </ul>
            </li>
          </ul> */}
        </li>
        <li>
          <Text strong>Earn points</Text> and start climbing the leaderboard.
        </li>
      </ol>
    </Paragraph>
    <br />
    <br />
    <br />
  </div>
);
