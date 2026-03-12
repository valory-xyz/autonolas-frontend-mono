import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph, Text } = Typography;

export const CoreConcepts = () => (
  <div id={DOCS_SECTIONS['core-concepts']}>
    <Title level={2}>Core Concepts</Title>
    <Paragraph>
      <ul>
        <li>
          <Text strong>Leaderboard</Text> – Climb the leaderboard by completing actions that
          contribute to Olas’ growth and success.
        </li>
        <li>
          <Text strong>Actions</Text> – Complete marketing tasks to earn points, upgrade your badge,
          and climb the leaderboard.
          <ul>
            Examples include:
            <li>Posting or resharing about Olas on X</li>
            <li>Amplifying co-marketing and partner posts</li>
            <li>Creating threads, videos, blogs, or graphics</li>
            {/* <li>Proposing content for @autonolas</li> */}
            <li>Joining viral campaigns and challenges</li>
            <li>Sharing updates about Olas products</li>
            <li>Supporting major events and product launches</li>
          </ul>
        </li>
        {/* <li>
          <Text strong>Post</Text> – Propose posts for Olas’ main X account (@autonolas) and
          contribute to its social presence.
        </li>
        <li>
          <Text strong>Proposals</Text> – Vote on post proposals using veOLAS; approved posts are
          published automatically by Olas agents.
        </li> */}
      </ul>
    </Paragraph>
    <br />
    <br />
    <br />
  </div>
);
