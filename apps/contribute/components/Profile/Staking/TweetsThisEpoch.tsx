import { XOutlined } from '@ant-design/icons';
import { Col, Flex, Grid, Row, Typography } from 'antd';
import styled from 'styled-components';

import { Tweet } from 'store/types';

import { TweetEmbed } from '../TweetEmbed';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const Scrollable = styled.div`
  max-height: 350px;
  overflow: auto;
`;

const MOBILE_TWEET_WIDTH = 250;
const TWEET_WIDTH = 310;

export const TweetsThisEpoch = ({ tweets }: { tweets: Tweet[] }) => {
  const screens = useBreakpoint();
  const isMobile = !!screens.xs;

  const tweetWidth = isMobile ? MOBILE_TWEET_WIDTH : TWEET_WIDTH;
  return tweets.length > 0 ? (
    <Scrollable>
      <Row gutter={[16, 16]} className="mt-12">
        {tweets.map((item) => (
          <Col
            key={item.tweet_id}
            xs={24}
            md={12}
            style={{ width: '100%', maxWidth: `${tweetWidth + 50}px` }}
          >
            <TweetEmbed tweetId={item.tweet_id} points={item.points} width={tweetWidth} />
          </Col>
        ))}
      </Row>
    </Scrollable>
  ) : (
    <Flex vertical align="center" className="mt-24 mb-24">
      <XOutlined style={{ color: '#A3AEBB', fontSize: 48 }} />
      <Text type="secondary">Nothing posted this epoch yet.</Text>
      <Text type="secondary">Share something on X!</Text>
    </Flex>
  );
};
