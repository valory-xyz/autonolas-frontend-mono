import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row, Typography } from 'antd';
import { useCallback, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Address } from 'viem';
import { useSignMessage } from 'wagmi';

import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { EducationTitle } from 'components/Education/EducationTitle';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { useModuleUtilities } from 'common-util/hooks/useModuleUtilities';
import { HUNDRED_K_OLAS_IN_WEI, MAX_TWEET_IMAGES, MAX_TWEET_LENGTH } from 'util/constants';

import { checkVotingPower } from '../MembersList/requests';
import MediaList from './MediaList';
import { Proposals } from './Proposals';
import ThreadModal from './ThreadModal';
import TweetLength from './TweetLength';
import UploadButton from './UploadButton';
import { ProposalCountRow, SocialPosterContainer } from './styles';
import { generateMediaHashes, getFirstTenCharsOfTweet } from './utils';

const { Text } = Typography;
const { TextArea } = Input;

const ToProposeTweetText = () => (
  <Text type="secondary">To propose a post, you must have at least 100k veOLAS voting power.</Text>
);

export type TweetOrThread = {
  text: string | string[];
  media: File[];
};

export const TweetPropose = () => {
  const { signMessageAsync } = useSignMessage();
  const { isStaging, account } = useHelpers();

  const { submitPostProposal } = useModuleUtilities();
  const [tweet, setTweet] = useState('');
  const [media, setMedia] = useState<TweetOrThread['media']>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThreadModalVisible, setIsThreadModalVisible] = useState(false);

  const handleSubmit = async (tweetOrThread: TweetOrThread) => {
    setIsSubmitting(true);

    try {
      if (!account) return;

      const has100kVotingPower = await checkVotingPower(account, HUNDRED_K_OLAS_IN_WEI);

      if (!isStaging && !has100kVotingPower) {
        notifyError('You must have at least 100k veOLAS voting power to propose a post.');
        return;
      }

      const signature = await signMessageAsync({
        message: `I am signing a message to verify that I propose a post starting with ${getFirstTenCharsOfTweet(
          tweetOrThread.text,
        )}`,
      });

      const mediaHashes = await generateMediaHashes(tweetOrThread);

      const tweetDetails = {
        request_id: uuid(),
        createdDate: Date.now() / 1000, // in seconds
        text: tweetOrThread.text,
        media_hashes: mediaHashes,
        posted: false,
        proposer: { address: account as Address, signature, verified: false },
        voters: [], // initially no votes
        executionAttempts: [], // initially no execution attempts
        action_id: '',
      };

      await submitPostProposal(tweetDetails);
      notifySuccess('Post proposed');

      // reset form
      setTweet('');
      setMedia([]);
    } catch (error) {
      notifyError('Post proposal failed');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onTweetChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTweet(event.target.value);
  }, []);

  const closeThreadModal = () => {
    setIsThreadModalVisible(false);
  };

  const canSubmit = !isSubmitting && (tweet?.length > 0 || media.length > 0) && account;

  return (
    <SocialPosterContainer>
      <EducationTitle title="Post" educationItem="post" />

      <TextArea
        value={tweet}
        onChange={onTweetChange}
        maxLength={MAX_TWEET_LENGTH}
        rows={4}
        className="mt-24 mb-12"
      />
      <MediaList
        media={media}
        handleDelete={(file) => setMedia((prev) => prev.filter((currItem) => currItem !== file))}
      />

      <ProposalCountRow>
        <TweetLength tweet={tweet} />
        <Row>
          <UploadButton
            disabled={!account || isSubmitting || media.length >= MAX_TWEET_IMAGES}
            onUploadMedia={(newMedia) => setMedia((prev) => [...prev, newMedia])}
          />
          <Button type="link" disabled={!canSubmit} onClick={() => setIsThreadModalVisible(true)}>
            <PlusCircleOutlined />
            &nbsp;Start thread
          </Button>
        </Row>
        {isThreadModalVisible && (
          <ThreadModal
            firstTweetInThread={tweet}
            firstMediaInThread={media}
            isSubmitting={isSubmitting}
            closeThreadModal={closeThreadModal}
            addThread={handleSubmit}
          />
        )}
      </ProposalCountRow>

      <Button
        className="mt-12 mb-12"
        type="primary"
        disabled={!canSubmit}
        loading={isSubmitting && !isThreadModalVisible}
        onClick={() => handleSubmit({ text: [tweet], media })}
      >
        Propose
      </Button>
      <br />
      <ToProposeTweetText />
    </SocialPosterContainer>
  );
};

export const Tweet = () => (
  <Row gutter={16}>
    <Col xs={24} md={24} lg={16} className="mb-24">
      <TweetPropose />
    </Col>

    <Col xs={24} md={24} lg={24}>
      <Proposals />
    </Col>
  </Row>
);
