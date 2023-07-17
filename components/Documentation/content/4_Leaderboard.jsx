import Link from 'next/link';
import { Typography } from 'antd/lib';
import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

const Leaderboard = () => (
  <div id={DOCS_SECTIONS.leaderboard}>
    <Title level={2}>Leaderboard</Title>
    <Paragraph>
      The Autonolas Contribute leaderboard ranks each community member according
      to the number of points they have earned.
    </Paragraph>

    <Paragraph>
      To earn more points, complete more&nbsp;
      <Link href={`/docs#${DOCS_SECTIONS.actions}`}>actions</Link>
      .
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);

export default Leaderboard;
