import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph, Text } = Typography;

export const HowToProposeAPost = () => (
  <div id={DOCS_SECTIONS['how-to-propose']}>
    <Title level={2}>How to Propose a Post</Title>
    <Paragraph>
      To propose a post, you must be a token holder — that is, hold at least{' '}
      <Text strong>100,000 veOLAS</Text>.<ol></ol>
      <ol>
        <li>
          Navigate to the <Text strong>Post</Text> page.
        </li>
        <li>Draft your proposal and submit it for community voting.</li>
        <li>
          <Text strong>Encourage the DAO to vote</Text> — proposals need support to go live!
        </li>
        <li>
          Once a post reaches a quorum of <Text strong>2 million veOLAS</Text>, it will be posted
          automatically.
        </li>
      </ol>
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
