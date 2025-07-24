import { Typography } from 'antd';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

export const ActionsDocs = () => (
  <div id={DOCS_SECTIONS.actions}>
    <Title level={2}>Actions</Title>
    <Paragraph>
      Actions are tasks that are designed by the DAO to maximize impact for Olas&apos; success. When
      community members complete actions, they contribute to the DAO&apos;s progress.
    </Paragraph>

    <Paragraph>
      Currently, there is one action: &quot;Spread the word on X&quot;. To complete this, you must
      first connect to X – you can do this via the Leaderboard page. Once connected, post about Olas
      being sure to either mention @autonolas, or use the hashtag #OlasNetwork. In the background,
      an AI-powered Olas service will analyse your post based on quality and relevance, and
      you&apos;ll be rewarded accordingly.
    </Paragraph>
    <br />
    <br />
    <br />
  </div>
);
