import { LoadingOutlined, TableOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card as CardAntd, Flex, Spin, Statistic, Typography } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Allocation } from 'types';
import { useAccount } from 'wagmi';

import { DAY_IN_SECONDS, WEEK_IN_SECONDS } from 'common-util/constants/time';
import { LoginV2 } from 'components/Login';
import { useVotingPower } from 'hooks/index';
import { useAppSelector } from 'store/index';

import { useThresholdData } from '../../Donate/hooks';
import { EditVotes } from '../EditVotes';
import { Votes } from './Votes';
import { COLOR } from 'libs/ui-theme/src';

const { Title, Paragraph, Text } = Typography;
const { Countdown: CountdownAntd } = Statistic;

const Card = styled(CardAntd)`
  display: flex;
  flex: none;
  height: max-content;
  max-width: 40%;
  width: 100%;
  min-height: 320px;

  .ant-card-body {
    display: flex;
    flex-direction: column;
    flex: auto;
  }
`;

const Countdown = styled(CountdownAntd)<{ isUrgent: boolean }>`
  .ant-statistic-content {
    font-size: 14px;
    color: ${({ isUrgent }) => (isUrgent ? COLOR.RED : COLOR.TEXT_PRIMARY)};
  }
`;

const ICON_STYLE = { fontSize: '56px', color: '#A3AEBB' };

type MyVotingWeightProps = {
  isUpdating: boolean;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  allocations: Allocation[];
  setAllocations: Dispatch<SetStateAction<Allocation[]>>;
};

const ConnectWallet = () => {
  return (
    <Flex align="center" vertical gap={16}>
      <WalletOutlined style={ICON_STYLE} />
      <Paragraph type="secondary" className="text-center">
        Connect your wallet to allocate your voting power.
      </Paragraph>
      <LoginV2 />
    </Flex>
  );
};

const GetVeOlas = () => {
  const router = useRouter();

  const handleOpenVeOlas = () => {
    router.push('/veolas');
  };
  return (
    <Flex align="center" justify="center" vertical gap={16}>
      <Image src={'/images/olas.svg'} alt="Olas" width={48} height={48} />
      <Paragraph type="secondary" className="text-center">
        Only veOLAS holders can vote on staking contracts. <br />
        Please lock OLAS for veOLAS to get started.
      </Paragraph>

      <Button size="large" type="primary" onClick={handleOpenVeOlas}>
        Get veOLAS
      </Button>
    </Flex>
  );
};

const EmptyVotes = () => {
  return (
    <Flex align="center" vertical gap={16}>
      <TableOutlined style={ICON_STYLE} />
      <Paragraph type="secondary" className="text-center">
        {`You haven't added any staking contracts to vote on yet.`}
      </Paragraph>
    </Flex>
  );
};

const Loader = () => {
  return (
    <Flex align="center" justify="center" vertical gap={16}>
      <Spin indicator={<LoadingOutlined spin />} />
    </Flex>
  );
};

export const MyVotingWeight = ({
  isUpdating,
  setIsUpdating,
  allocations,
  setAllocations,
}: MyVotingWeightProps) => {
  const { isConnected: isAccountConnected, address: account } = useAccount();

  const { data: votingPower, isFetching: isVotingPowerLoading } = useVotingPower(account);
  const { userVotes, isUserVotesLoading } = useAppSelector((state) => state.govern);
  const { nextEpochEndTime } = useThresholdData();
  const [isOneDayLeftToVote, setIsOneDayLeftToVote] = useState(false);

  const content = useMemo(() => {
    // If the user didn't connect their wallet, suggest to connect
    if (!isAccountConnected) {
      return <ConnectWallet />;
    }

    if (isVotingPowerLoading) {
      // Show loader while don't have balance data
      return <Loader />;
    }

    // If the user doesn't have voting power, suggest to get veOLAS
    if (Number(votingPower) === 0) {
      return <GetVeOlas />;
    }

    if (!isUserVotesLoading) {
      // If the user added something for voting, show edit mode
      if (isUpdating && allocations.length !== 0) {
        return (
          <EditVotes
            allocations={allocations}
            setAllocations={setAllocations}
            setIsUpdating={setIsUpdating}
          />
        );
      }

      // If the user has never voted, show empty state
      if (Object.values(userVotes).length === 0) {
        return <EmptyVotes />;
      }

      // If the user has voted, and is not updating votes, show their current votes
      return <Votes setIsUpdating={setIsUpdating} setAllocations={setAllocations} />;
    }

    // Show loader otherwise
    return <Loader />;
  }, [
    isAccountConnected,
    allocations,
    isUpdating,
    setIsUpdating,
    isUserVotesLoading,
    isVotingPowerLoading,
    setAllocations,
    userVotes,
    votingPower,
  ]);

  const lastVoteTime = useMemo(() => {
    if (!nextEpochEndTime) return null;
    return Math.floor(nextEpochEndTime / WEEK_IN_SECONDS) * WEEK_IN_SECONDS * 1000;
  }, [nextEpochEndTime]);

  useEffect(() => {
    if (!lastVoteTime) return;

    const checkTimeLeftToVote = () => {
      const timeLeft = lastVoteTime - Date.now();
      setIsOneDayLeftToVote(timeLeft < DAY_IN_SECONDS * 1000 && timeLeft > 0);
    };

    const timer = setInterval(checkTimeLeftToVote, 60 * 1000);
    return () => clearInterval(timer);
  }, [lastVoteTime]);

  return (
    <Card className="flex-none">
      <Flex justify="space-between" align="baseline" wrap="wrap">
        <Title level={3} className="m-0">
          My voting weight
        </Title>

        {lastVoteTime && (
          <Flex gap={8} align="baseline">
            <Paragraph type="secondary" className="m-0">
              Time left to vote:
            </Paragraph>
            <Text type="secondary">
              <Countdown
                value={lastVoteTime}
                format="D[d] H[h] m[m] s[s]"
                isUrgent={isOneDayLeftToVote}
              />
            </Text>
          </Flex>
        )}
      </Flex>
      <Paragraph type="secondary" className="mt-8 mb-16">
        Allocate your voting power to direct OLAS emissions to different staking contracts.
      </Paragraph>

      {content}
    </Card>
  );
};
