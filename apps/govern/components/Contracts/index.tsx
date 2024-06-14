import { Flex } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useAppSelector } from 'store/index';
import { Allocation, StakingContract } from 'types/index';

import { ContractsList } from './ContractsList';
import { MyVotingWeight } from './MyVotingWeight';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

export const ContractsPage = () => {
  const { userVotes, isUserVotesLoading } = useAppSelector((state) => state.govern);

  const [isUpdating, setIsUpdating] = useState(true);
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
