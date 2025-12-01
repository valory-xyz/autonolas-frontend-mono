import {
  CaretDownOutlined,
  CaretRightOutlined,
  QuestionCircleOutlined,
  WarningFilled,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Collapse,
  Divider,
  Flex,
  Progress,
  Row,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { getAddress } from 'ethers';
import { isNil, isNumber } from 'lodash';
import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

import { COLOR, NA } from '@autonolas/frontend-library';

import { getBytes32FromAddress, truncateAddress } from 'common-util/functions';
import { formatDynamicTimeRange, getTimestamp } from 'common-util/functions/time';
import { LeaderboardUser, Tweet } from 'store/types';
import { GOVERN_APP_URL, OLAS_UNICODE_SYMBOL, STAKING_CONTRACTS_DETAILS } from 'util/constants';
import { useServiceInfo, useStakingDetails } from 'util/staking';

import { HowTweetsAreScoredModal, TweetCountTooltip } from './HowTweetsAreScored';
import { RecovererAlertAlpha, RecovererAlertBeta } from './RecovererAlert';
import { TweetsThisEpoch } from './TweetsThisEpoch';
import { useRestake } from './hooks';

const { Title, Text, Paragraph } = Typography;

const StyledProgress = styled(Progress)`
  max-width: 200px;
`;
const StyledDivider = styled(Divider)`
  width: auto;
  margin: 24px -24px;
`;

type InfoColumnProps = {
  isLoading?: boolean;
  title: string;
  value?: string | ReactNode;
  link?: {
    href: string;
    text: string;
  };
  children?: ReactNode;
  comingSoonButtonText?: string;
};

const InfoColumn = ({
  isLoading,
  title,
  value,
  link,
  children,
  comingSoonButtonText,
}: InfoColumnProps) => {
  let content = null;

  if (isLoading) {
    content = <Skeleton.Input active size="small" />;
  } else {
    if (!isNil(value)) {
      content = <Text className="font-weight-600">{value}</Text>;
    } else if (!isNil(link)) {
      content = (
        <a href={link.href} target="_blank">
          {link.text} ↗
        </a>
      );
    }
  }

  return (
    <Col xs={24} lg={8}>
      <Text type="secondary" className="block mb-4">
        {title}
      </Text>
      {content}
      {children}
      {comingSoonButtonText && (
        <Tooltip title={<Text>Coming soon</Text>} color={COLOR.WHITE}>
          <Button size="small" disabled className="block mt-8">
            {comingSoonButtonText}
          </Button>
        </Tooltip>
      )}
    </Col>
  );
};

type StakingDetailsProps = {
  profile: LeaderboardUser;
  tweets: Tweet[];
};

export const StakingDetails = ({ profile, tweets }: StakingDetailsProps) => {
  const { address: account } = useAccount();
  const isNewContracts = !!profile.service_id;

  const { data, isLoading: isServiceInfoLoading } = useServiceInfo({
    account,
    isNew: isNewContracts,
  });
  const stakingInstance = data?.stakingInstance;
  const contractDetails = stakingInstance && STAKING_CONTRACTS_DETAILS[getAddress(stakingInstance)];

  // If the user staked on new contracts, use service_multisig, otherwise use service_multisig_old
  const serviceMultisig = profile.service_multisig || profile.service_multisig_old;

  // If the user staked on new contracts, use service_id, otherwise use service_id_old
  const serviceId = (profile.service_id || profile.service_id_old)?.toString() ?? null;
  const { data: stakingDetails, isLoading: isStakingDetailsLoading } = useStakingDetails(
    serviceId,
    stakingInstance,
  );

  const { isRestaking, handleRestake } = useRestake({ contractAddress: stakingInstance });

  const tweetsThisEpoch = useMemo(() => {
    if (!isNumber(stakingDetails.epochCounter)) return [];
    if (stakingDetails.stakingStatus !== 'Staked') return [];

    return Object.entries(tweets)
      .map(([tweetId, tweet]) => ({ tweetId, ...tweet }))
      .filter((tweet) => {
        if (isNil(stakingDetails.epochCounter)) return false;

        /**
         * a dirty hack with stakingDetails.tsStart to calculate points only starting from the migration point
         * BE only stores epochs number regardless the staking instance (while each has their own epoch counter)
         * preventing from separating old contracts (with 20+ epochs) from the new ones (they've just started)
         */
        if (!tweet.timestamp) return false;
        if (Number(getTimestamp(tweet.timestamp)) < Number(stakingDetails.tsStart)) return false;

        return Number(tweet.epoch) > stakingDetails.epochCounter && tweet.points > 0;
      });
  }, [stakingDetails.epochCounter, stakingDetails.stakingStatus, stakingDetails.tsStart, tweets]);

  // Calculate total points earned for current epoch's tweets
  const pointsEarned = useMemo(() => {
    if (contractDetails?.isDeprecated) return 0;

    return tweetsThisEpoch.reduce((sum, tweet) => {
      if (
        !isNil(stakingDetails.epochCounter) &&
        Number(tweet.epoch) > stakingDetails.epochCounter
      ) {
        sum += tweet.points;
      }
      return sum;
    }, 0);
  }, [contractDetails, tweetsThisEpoch, stakingDetails]);

  const pointsPercentage = contractDetails
    ? Math.min((pointsEarned / contractDetails.pointsPerEpoch) * 100, 100)
    : 0;

  const stakingStatusColumnData = useMemo(() => {
    if (isServiceInfoLoading) return;

    let value;
    let comingSoonButtonText;
    let children;

    if (stakingDetails.stakingStatus === 'Unstaked') {
      value = 'Not staked';
    }
    if (contractDetails && stakingDetails.stakingStatus === 'Staked') {
      value = `Staked · ${contractDetails.totalBond} OLAS`;
      comingSoonButtonText = 'Unstake';
    }
    if (stakingDetails.stakingStatus === 'Evicted') {
      value = (
        <Flex gap={4}>
          <WarningFilled style={{ color: '#FA8C16' }} />
          Temporarily evicted
          <Tooltip
            color={COLOR.WHITE}
            title={
              <Text>You didn&apos;t post enough and missed the epoch target multiple times.</Text>
            }
          >
            <QuestionCircleOutlined style={{ color: '#4D596A' }} />
          </Tooltip>
        </Flex>
      );
      if (stakingDetails.isEligibleForStaking) {
        children = (
          <Button size="small" loading={isRestaking} onClick={handleRestake} className="block mt-8">
            Restake
          </Button>
        );
      } else {
        children = (
          <Tooltip
            title={
              <Text>
                You’ll be able to restake at approximately{' '}
                {formatDynamicTimeRange(stakingDetails.canUnstakeTimestamp)}.
              </Text>
            }
            color={COLOR.WHITE}
          >
            <Button size="small" disabled className="block mt-8">
              Restake
            </Button>
          </Tooltip>
        );
      }
    }

    return { value, comingSoonButtonText, children };
  }, [
    isServiceInfoLoading,
    stakingDetails.stakingStatus,
    stakingDetails.isEligibleForStaking,
    stakingDetails.canUnstakeTimestamp,
    contractDetails,
    isRestaking,
    handleRestake,
  ]);

  return (
    <>
      {profile.service_id_old ? (
        <RecovererAlertAlpha
          isNew={isNewContracts}
          unstakeTimestamp={isNewContracts ? null : stakingDetails.canUnstakeTimestamp}
        />
      ) : (
        <RecovererAlertBeta safeAddress={serviceMultisig} />
      )}
      <StyledDivider />
      <Title level={5}>Rewards</Title>
      <Row gutter={[16, 24]} className="w-100 mb-32">
        <InfoColumn
          title="Points earned this epoch"
          isLoading={isServiceInfoLoading}
          value={
            contractDetails ? (
              <div>{`${pointsEarned} / ${contractDetails.pointsPerEpoch}`}</div>
            ) : undefined
          }
        >
          {!isServiceInfoLoading && (
            <StyledProgress
              percent={pointsPercentage}
              showInfo={pointsPercentage === 100}
              strokeColor={pointsPercentage < 100 ? COLOR.PRIMARY : undefined}
            />
          )}
        </InfoColumn>
        <InfoColumn title="OLAS rewards this epoch" isLoading={isStakingDetailsLoading}>
          {contractDetails && stakingDetails?.rewardsPerEpoch ? (
            <Flex gap={8} wrap="wrap">
              <Text className="font-weight-600">
                {`${OLAS_UNICODE_SYMBOL}${stakingDetails.rewardsPerEpoch}`}
              </Text>
              {pointsPercentage === 100 ? (
                <Tag color="success">Earned</Tag>
              ) : (
                <Tag color="blue">Not yet earned</Tag>
              )}
            </Flex>
          ) : null}
        </InfoColumn>
        <InfoColumn
          title="Total OLAS rewards"
          isLoading={isStakingDetailsLoading}
          value={
            stakingDetails.totalRewards !== null
              ? `${OLAS_UNICODE_SYMBOL}${stakingDetails.totalRewards}`
              : undefined
          }
        />
        <InfoColumn
          title="Epoch end time"
          isLoading={isStakingDetailsLoading}
          value={
            stakingDetails.epochEndTimestamp
              ? formatDynamicTimeRange(stakingDetails.epochEndTimestamp)
              : NA
          }
        />
        <InfoColumn
          title="Epoch length"
          isLoading={isStakingDetailsLoading}
          value={stakingDetails.epochLength ?? undefined}
        />
      </Row>
      <Collapse
        expandIcon={({ isActive }) => (isActive ? <CaretDownOutlined /> : <CaretRightOutlined />)}
        items={[
          {
            key: '1',
            label: 'My posts this epoch',
            children: <TweetsThisEpoch tweets={tweetsThisEpoch} />,
          },
        ]}
      />
      <TweetCountTooltip />

      <StyledDivider />
      <Title level={5}>Details</Title>
      <Row gutter={[16, 24]} className="w-100 mb-32">
        <InfoColumn
          title="Status"
          isLoading={isServiceInfoLoading || isStakingDetailsLoading}
          value={stakingStatusColumnData?.value}
          comingSoonButtonText={stakingStatusColumnData?.comingSoonButtonText}
        >
          {stakingStatusColumnData?.children}
        </InfoColumn>
        <InfoColumn
          title="Staking contract"
          isLoading={isServiceInfoLoading}
          link={
            contractDetails
              ? {
                  href: `${GOVERN_APP_URL}/contracts/${getBytes32FromAddress(stakingInstance)}`,
                  text: contractDetails.name,
                }
              : undefined
          }
          comingSoonButtonText="Change"
        />
        <InfoColumn
          title="Your Safe address"
          link={
            serviceMultisig
              ? {
                  href: `${base.blockExplorers.default.url}/address/${serviceMultisig}`,
                  text: truncateAddress(serviceMultisig),
                }
              : undefined
          }
        />
      </Row>

      <StyledDivider />
      <Title level={5}>Guidelines</Title>
      <Paragraph type="secondary">
        To be eligible to earn rewards, make the required number of posts each epoch and include at
        least one of the keywords from active campaigns.
      </Paragraph>
      <Flex align="center" gap={8} wrap="wrap">
        <Link href="/leaderboard">Review active campaigns on Leaderboard</Link>
        <Text type="secondary">•</Text>
        <HowTweetsAreScoredModal />
      </Flex>
    </>
  );
};
