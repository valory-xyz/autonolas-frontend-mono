import { Button, Card, Progress, Typography } from 'antd';
import { useMemo } from 'react';
import { Address } from 'viem';

import { NA } from '@autonolas/frontend-library';

import { getNumberInMillions } from 'common-util/functions';
import { getCurrentProposalInfo } from 'common-util/functions/proposal';
import { useHelpers } from 'common-util/hooks/useHelpers';
import type { ModuleDetails } from 'store/types';
import { VEOLAS_QUORUM } from 'util/constants';

import MediaList, { MODE } from '../MediaList';
import { ViewThread } from '../ViewThread';

const { Text } = Typography;

const ConnectWalletToApprove = () => (
  <Text type="secondary" className="px-12">
    To approve, connect your wallet
  </Text>
);

type ApproveStepProps = {
  isApproveLoading: boolean;
  proposal: ModuleDetails['scheduled_tweet']['tweets'][number];
  onApprove: () => void;
};

export const ApproveStep = ({ isApproveLoading, proposal, onApprove }: ApproveStepProps) => {
  const { account } = useHelpers();

  const {
    isQuorumAchieved,
    votersAddress,
    totalVeolasInEth,
    totalVeolasInvestedInPercentage,
    isProposalVerified,
  } = getCurrentProposalInfo(proposal);
  const hasVoted = votersAddress?.includes(account as Address) ?? false;
  const canMoveToExecuteStep = isQuorumAchieved || proposal.posted;
  const isApproveDisabled = !account || !isProposalVerified || proposal?.posted;

  const tweetData = useMemo(() => {
    if (typeof proposal?.text === 'string') {
      return {
        tweet: { text: proposal.text, media: proposal?.media_hashes ?? [] },
      };
    }

    if (Array.isArray(proposal?.text)) {
      return {
        thread: proposal.text.map((text, index) => {
          const tweetMedia = (proposal?.media_hashes ?? [])?.[index];
          const media = tweetMedia ? [tweetMedia] : [];
          return {
            text,
            media,
          };
        }),
      };
    }

    return {};
  }, [proposal?.media_hashes, proposal?.text]);

  return (
    <>
      <Card className="mb-12" bodyStyle={{ padding: 16 }}>
        {/* If string, just a tweet else a thread (array of string) */}
        {tweetData.tweet && (
          <>
            <div className="mb-12">
              <Text>{tweetData.tweet.text ?? NA}</Text>
            </div>
            <MediaList media={tweetData.tweet.media} mode={MODE.VIEW} className="mb-12" />
            <Text type="secondary">
              {tweetData.tweet.text.length}
              /280 characters
            </Text>
          </>
        )}
        {tweetData.thread && <ViewThread thread={tweetData.thread} />}
      </Card>

      {hasVoted ? (
        <Text className="mb-8">✅ You approved</Text>
      ) : (
        <div className="mb-8">
          <Button
            ghost
            type="primary"
            loading={isApproveLoading}
            disabled={isApproveDisabled}
            onClick={onApprove}
          >
            Approve this post
          </Button>

          {!account && <ConnectWalletToApprove />}
        </div>
      )}

      <div className="mb-12">
        <div>{`${getNumberInMillions(Number(totalVeolasInEth))} veOLAS has approved`}</div>
        <div>
          {`Quorum ${canMoveToExecuteStep ? '' : 'not '} achieved ${
            canMoveToExecuteStep ? '✅ ' : ''
          } - ${getNumberInMillions(Number(totalVeolasInEth))}/${getNumberInMillions(
            VEOLAS_QUORUM,
          )} veOLAS`}
        </div>
        <Progress percent={Number(totalVeolasInvestedInPercentage)} />
      </div>
    </>
  );
};
