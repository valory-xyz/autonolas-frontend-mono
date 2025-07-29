import { Typography } from 'antd';

import educationItems from 'components/Education/data.json';

import { DOCS_SECTIONS } from '../helpers';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export const Overview = () => {
  const filteredEducationItems = educationItems.filter((item) => item.hidden !== true);

  return (
    <div id={DOCS_SECTIONS.overview}>
      <Title level={2}>Overview</Title>
      <Paragraph>
        Olas Contribute is a system for coordinating work in Olas DAO. It is made up of several main
        components:
      </Paragraph>

      <Paragraph>
        <ul>
          {filteredEducationItems.map((item) => (
            <li key={item.id}>
              <Text strong style={{ textTransform: 'capitalize' }}>
                {item.component}
              </Text>
              &nbsp;–&nbsp;
              {item.text}
            </li>
          ))}
        </ul>
      </Paragraph>

      <Paragraph>
        Olas Contribute is a system for coordinating content marketing in Olas DAO. Community
        members earn points, climb a leaderboard, and propose content for Olas&apos; social
        channels, contributing directly to Olas&apos; success. The system runs on decentralized{' '}
        <Link href="https://olas.network/agents#:~:text=a%20single%20party.-,Sovereign%20AI%20Agents,-Lightweight%20agents%20that">
          AI agents
        </Link>{' '}
        ensuring decentralization and transparency.
      </Paragraph>

      <br />
      <br />
      <br />
    </div>
  );
};
