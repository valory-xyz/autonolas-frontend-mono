import { Flex } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Allocation, StakingContract } from 'types';

import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { ContractsList } from './ContractsList';
import { MyVotingWeight } from './MyVotingWeight/MyVotingWeight';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

type ContractsPageProps = {
  initialContracts?: StakingContract[];
};

export const ContractsPage = ({ initialContracts }: ContractsPageProps) => {
  const dispatch = useAppDispatch();
  const { userVotes, isUserVotesLoading, stakingContracts } = useAppSelector(
    (state) => state.govern,
  );

  // Pre-populate Redux store with SSR data if store is empty
  useEffect(() => {
    if (initialContracts && initialContracts.length > 0 && stakingContracts.length === 0) {
      dispatch(setStakingContracts(initialContracts));
    }
  }, [initialContracts, stakingContracts.length, dispatch]);

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
        <ContractsList isUpdating={isUpdating} handleAdd={handleAdd} allocations={allocations} />
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
