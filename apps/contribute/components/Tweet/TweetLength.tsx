import { Typography } from 'antd';

import { MAX_TWEET_LENGTH } from 'util/constants';

const { Text } = Typography;

type TweetLengthProps = {
  tweet: string;
};

const TweetLength = ({ tweet }: TweetLengthProps) => (
  <Text type="secondary">{`${(tweet ?? '').length} / ${MAX_TWEET_LENGTH}`}</Text>
);

export default TweetLength;
