import { LoadingOutlined, TableOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card as CardAntd, Flex, Spin, Typography } from 'antd';
import { useVotingPower } from 'hooks/index';
import Image from 'next/image';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { Allocation } from 'types/index';
import { useAccount } from 'wagmi';

import { useAppSelector } from 'store/index';
import styled from 'styled-components';

import { GET_VEOLAS_URL } from 'common-util/constants/urls';
import { LoginV2 } from 'components/Login';

import { EditVotes } from './EditVotes';
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
        Only users with veOLAS can vote on staking contracts. <br />
        Please lock OLAS for veOLAS to get started.
      </Paragraph>
      <Button type="primary" target="_blank" href={GET_VEOLAS_URL}>
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
    } else if (isVotingPowerLoading) {
      // Show loader while don't have balance data
      return <Loader />;
    } else {
      // If the user doesn't have voting power, suggest to get veOlas
      if (Number(votingPower) === 0) {
        return <GetVeOlas />;
      } else if (!isUserVotesLoading) {
        if (isUpdating && allocations.length !== 0) {
          // If the user added something for voting, show edit mode
          return (
            <EditVotes
              allocations={allocations}
              setAllocations={setAllocations}
              setIsUpdating={setIsUpdating}
            />
          );
        } else if (Object.values(userVotes).length === 0) {
          // If the user has never voted, show empty state
          return <EmptyVotes />;
        } else {
          // If the user has voted, and is not updating votes, show their current votes
          return <Votes />;
        }
      } else {
        // Show loader otherwise
        return <Loader />;
      }
    }
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
