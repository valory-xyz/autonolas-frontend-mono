import { Flex } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Allocation, StakingContract } from 'types';

import { useFetchUserVotes } from 'hooks/useFetchUserVotes';
import { useAppSelector } from 'store/index';

import { ContractsList } from './ContractsList';
import { MyVotingWeight } from './MyVotingWeight/MyVotingWeight';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

type ContractsPageProps = {
  /** Snapshot pre-rendered by `getStaticProps`, so the table ships as HTML. */
  initialContracts?: StakingContract[];
  /** When that snapshot was taken (ISO-8601 UTC), or null if the fetch failed. */
  snapshotGeneratedAt?: string | null;
};

export const ContractsPage = ({ initialContracts, snapshotGeneratedAt }: ContractsPageProps) => {
  useFetchUserVotes();
  const { userVotes, isUserVotesLoading } = useAppSelector((state) => state.govern);

  const [isUpdating, setIsUpdating] = useState(false);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  useEffect(() => {
    // If the user has never voted, immediately turn on the editing mode
    if (!isUserVotesLoading && Object.values(userVotes).length === 0) {
      setIsUpdating(true);
    }
  }, [isUserVotesLoading, userVotes]);

  const handleAdd = (contract: StakingContract) => {
    setAllocations((prev) => [...prev, { ...contract, weight: 0 }]);
  };

  return (
    <StyledMain>
      <Flex gap={24}>
        <ContractsList
          isUpdating={isUpdating}
          handleAdd={handleAdd}
          allocations={allocations}
          initialContracts={initialContracts}
          snapshotGeneratedAt={snapshotGeneratedAt}
        />
        <MyVotingWeight
          isUpdating={isUpdating}
          setIsUpdating={setIsUpdating}
          allocations={allocations}
          setAllocations={setAllocations}
        />
      </Flex>
    </StyledMain>
  );
};
