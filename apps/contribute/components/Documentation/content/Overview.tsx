import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';
import Link from 'next/link';
import { SITE_URL } from 'libs/util-constants/src';

const { Title, Paragraph } = Typography;

export const Overview = () => (
  <div id={DOCS_SECTIONS.overview}>
    <Title level={2}>Overview</Title>

    <Paragraph>
      Olas Contribute is a system for coordinating content marketing in Olas DAO. Community members
      earn points, climb a leaderboard, and propose content for Olas&apos; social channels,
      contributing directly to Olas&apos; success. The system runs on decentralized{' '}
      <Link href={`${SITE_URL}/agents#agents`}>AI agents</Link> ensuring decentralization and
      transparency.
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
