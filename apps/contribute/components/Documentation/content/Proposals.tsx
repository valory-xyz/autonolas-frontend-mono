import { Typography } from 'antd';
import Link from 'next/link';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

export const Proposals = () => (
  <div id={DOCS_SECTIONS.proposals}>
    <Title level={2}>Proposals</Title>
    <Paragraph>
      Once a post is proposed, other members can vote on it. All proposals can be reviewed on the{' '}
      <Link href="/post">Post</Link> page. To be posted, a quorum of 2 million veOLAS must be
      reached. For example, if there are 10 users each with 200k veOLAS, and they collectively vote,
      they can reach the 2 million veOLAS quorum required to post.
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
