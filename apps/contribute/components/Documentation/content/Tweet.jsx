import { Typography } from 'antd';
import Link from 'next/link';

import { VEOLAS_URL } from 'util/constants';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

export const Tweet = () => (
  <div id={DOCS_SECTIONS.tweet}>
    <Title level={2}>Post</Title>
    <Paragraph>
      Members have the unique ability to write and propose new posts to be posting from the{' '}
      <a href="https://x.com/autonolas">Olas X account</a>. This puts the community in control of
      the narrative and a key piece of the brand.
    </Paragraph>

    <Paragraph>
      First, become a <Link href="#members">member</Link>. Then head to the{' '}
      <Link href="/post">Post</Link> page. Write your post and propose it. Other members will vote
      on it. If the proposed post gets enough voting power, it will be posted.
    </Paragraph>

    <Paragraph>
      Voting power is measured in veOLAS. OLAS holders lock veOLAS in order to be able to
      participate in Contribute, DAO voting and service donations.{' '}
      <a href={VEOLAS_URL} rel="noopener noreferrer" target="_blank">
        Get veOLAS
      </a>
      .
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
