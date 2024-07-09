import { LoadingOutlined, TableOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card as CardAntd, Flex, Spin, Typography } from 'antd';
import Image from 'next/image';
import { Dispatch, SetStateAction, useMemo } from 'react';
import styled from 'styled-components';
import { Allocation } from 'types';
import { useAccount } from 'wagmi';

import { MEMBER_URL } from 'libs/util-constants/src';

import { LoginV2 } from 'components/Login';
import { useVotingPower } from 'hooks/index';
import { useAppSelector } from 'store/index';

import { EditVotes } from '../EditVotes';
import { Votes } from './Votes';

const { Title, Paragraph } = Typography;

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
  return (
    <Flex align="center" justify="center" vertical gap={16}>
      <Image src={'/images/olas.svg'} alt="Olas" width={48} height={48} />
      <Paragraph type="secondary" className="text-center">
        Only veOLAS holders can vote on staking contracts. <br />
        Please lock OLAS for veOLAS to get started.
      </Paragraph>
      <Button type="primary" target="_blank" href={MEMBER_URL}>
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

  const content = useMemo(() => {
    // If the user didn't connect their wallet, suggest to connect
    if (!isAccountConnected) {
      return <ConnectWallet />;
    }

    if (isVotingPowerLoading) {
      // Show loader while don't have balance data
      return <Loader />;
    }

    // If the user doesn't have voting power, suggest to get veOlas
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

  return (
    <Card className="flex-none">
      <Title level={3} className="m-0">
        My voting weight
      </Title>
      <Paragraph type="secondary" className="mt-8 mb-16">
        Allocate your voting power to direct OLAS emissions to different staking contracts.
      </Paragraph>

      {content}
    </Card>
  );
};
