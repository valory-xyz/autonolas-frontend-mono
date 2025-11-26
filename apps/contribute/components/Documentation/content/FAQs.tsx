import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';
import Link from 'next/link';
// import { GOVERN_URL } from 'libs/util-constants/src';

const { Title, Paragraph, Text } = Typography;

export const FAQs = () => (
  <div id={DOCS_SECTIONS.faq}>
    <Title level={2}>Troubleshooting / FAQs</Title>

    <Paragraph>
      <div>
        <Text strong>Why didn&apos;t I earn points for my actions?</Text>
      </div>
      Actions are validated by AI services. To earn points, your post must be{' '}
      <Text strong>
        relevant, high-quality, and include one or more of the active{' '}
        <Link href="/leaderboard">Campaigns</Link>
      </Text>
      .
      <br />
      Make sure you&apos;re following the campaign guidelines and using the suggested content or
      themes.
    </Paragraph>

    {/* <Paragraph>
      <div>
        <Text strong>What is veOLAS voting?</Text>
      </div>
      veOLAS is the locked form of OLAS tokens, giving members voting power to propose and approve
      posts. You can lock OLAS for veOLAS here:{' '}
      <Link href={`${GOVERN_URL}/veolas`}>{GOVERN_URL}/veolas</Link>
    </Paragraph> */}

    <Paragraph>
      <div>
        <Text strong>How often are scores updated?</Text>
      </div>
      Points are updated periodically via a decentralized agent.
    </Paragraph>

    <Paragraph>
      <div>
        <Text strong>Contributing / Feedback</Text>
      </div>
      Found something outdated? Suggest an improvement or report an issue on{' '}
      <a
        href="https://github.com/valory-xyz/autonolas-frontend-mono/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      .
    </Paragraph>

    <Paragraph>
      <div>
        <Text strong>Learn More</Text>
      </div>
      Explore other Olas resources and governance processes through{' '}
      <Link href="https://olas.network/">the main site</Link>.
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
