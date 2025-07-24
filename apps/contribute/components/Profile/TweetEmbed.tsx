import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Spin, Typography } from 'antd';
import { useState } from 'react';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import styled from 'styled-components';

const { Text } = Typography;

const TweetPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 16px;
  min-height: 120px;
`;

const StyledCard = styled(Card)`
  width: 100%;
`;

type TweetEmbedProps = {
  tweetId: string;
  points: number;
  width?: number;
};

export const TweetEmbed = ({ points, tweetId, width = 250 }: TweetEmbedProps) => {
  const [isError, setIsError] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Toggle isReloading state so that TwitterTweetEmbed
  // component is mounted again and can be reloaded automatically
  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => setIsReloading(false));
    setIsError(false);
  };

  return (
    <StyledCard
      title={`Points earned: ${points}`}
      style={{ maxWidth: `${width + 32}px` }}
      styles={{
        title: { fontSize: '16px' },
        body: { padding: '8px 16px' },
      }}
    >
      {isError && (
        <TweetPlaceholder>
          <Text className="block">Failed to load the post, please try reloading</Text>
          <Button onClick={handleReload} icon={<ReloadOutlined />} type="text" />
        </TweetPlaceholder>
      )}
      {!isReloading && (
        <TwitterTweetEmbed
          tweetId={`${tweetId}`}
          options={{
            width,
            cards: 'hidden',
            conversation: 'none',
          }}
          onLoad={(element) => {
            if (!element) {
              setIsError(true);
            }
          }}
          placeholder={
            <TweetPlaceholder>
              <Spin size="large" />
            </TweetPlaceholder>
          }
        />
      )}
    </StyledCard>
  );
};
