import { Col, Row, Typography } from 'antd';
import isEqual from 'lodash/isEqual';
import Link from 'next/link';
import { memo } from 'react';
import styled from 'styled-components';

import { Tweet } from 'store/types';

import { TweetEmbed } from './TweetEmbed';
import { shuffleArray } from './utils';

const MAX_TWEETS_SHOWN = 2;

const { Paragraph, Text } = Typography;

const StyledCol = styled(Col)`
  flex: auto;
  max-width: 306px;
`;
const NoTweetsText = styled(Paragraph)`
  max-width: 400px;
`;

type PointsShowcaseProps = {
  tweetsData: Tweet[] | undefined;
};

export const PointsShowcase = memo(
  function PointsShowcase({ tweetsData }: PointsShowcaseProps) {
    const earnedPointsTweets = tweetsData?.filter((tweet) => tweet.points > 0);

    const tweets = shuffleArray(earnedPointsTweets || []).slice(0, MAX_TWEETS_SHOWN);

    return (
      <>
        <Text className="font-weight-600 mt-24" type="secondary">
          Points Showcase
        </Text>
        {tweets.length > 0 ? (
          <>
            <Paragraph type="secondary">
              Here is a selection of posts you have made that have earned points.
            </Paragraph>

            <Row gutter={[16, 16]} className="mt-12">
              {tweets.map((item) => (
                <StyledCol key={item.tweet_id} xs={24} md={8}>
                  <TweetEmbed tweetId={item.tweet_id} points={item.points} width={250} />
                </StyledCol>
              ))}
            </Row>
          </>
        ) : (
          <NoTweetsText type="secondary" className="mt-12">
            No posts found. Connect your X account and start completing{' '}
            <Link href="/leaderboard">actions</Link> to earn more points
          </NoTweetsText>
        )}
      </>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps.tweetsData, nextProps.tweetsData),
);
