import { ethers } from 'ethers';
import { useMemo } from 'react';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useAccount, useBlock, useReadContracts } from 'wagmi';

import { OLAS, VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { LATEST_BLOCK_KEY } from 'common-util/constants/scopeKeys';

import { useVotingPower } from './useVotingPower';

const getContracts = (account: Address) => [
  {
    address: OLAS.addresses[mainnet.id],
    abi: OLAS.abi,
    chainId: mainnet.id,
    functionName: 'balanceOf',
    args: [account],
  },
  {
    address: VE_OLAS.addresses[mainnet.id],
    abi: VE_OLAS.abi,
    chainId: mainnet.id,
    functionName: 'totalSupplyLocked',
  },
  {
    address: VE_OLAS.addresses[mainnet.id],
    abi: VE_OLAS.abi,
    chainId: mainnet.id,
    functionName: 'mapLockedBalances',
    args: [account],
  },
];

export const useFetchBalances = () => {
  const { address: account } = useAccount();
  const {
    data: votingPower,
    isFetching: isVotingPowerFetching,
    refetch: refetchVotingPower,
  } = useVotingPower(account);

  const {
    data: block,
    isFetching: isBlockFetching,
    refetch: refetchBlock,
  } = useBlock({
    blockTag: 'latest',
    scopeKey: LATEST_BLOCK_KEY,
  });

  const {
    data: balanceData,
    isFetching: isBalanceFetching,
    refetch: refetchBalances,
  } = useReadContracts({
    contracts: getContracts(account || '0x'),
    query: {
      enabled: !!account,
      select: (data) => {
        const [olasBalanceData, totalSupplyLockedData, mapLockedBalancesData] = data;
        const [veOlasBalance, lockedEnd] = mapLockedBalancesData.result as bigint[];

        return {
          olasBalance: ethers.formatUnits(olasBalanceData.result as bigint, 18),
          veOlasBalance: ethers.formatUnits(veOlasBalance as bigint, 18),
          totalSupplyLocked: ethers.formatUnits(totalSupplyLockedData.result as bigint, 18),
          lockedEnd: Number(lockedEnd) * 1000,
        };
      },
    },
  });

  const canWithdrawVeolas = useMemo(() => {
    if (balanceData === undefined) return false;
    if (block === undefined) return false;

    return Number(balanceData.veOlasBalance) > 0 && balanceData.lockedEnd <= block.timestamp;
  }, [balanceData, block]);

  const refetch = async () => {
    try {
      await refetchVotingPower();
      await refetchBlock();
      await refetchBalances();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    isLoading: isVotingPowerFetching || isBalanceFetching || isBlockFetching,
    account,
    votingPower,
    totalSupply: balanceData?.totalSupplyLocked,
    olasBalance: balanceData?.olasBalance,
    veOlasBalance: balanceData?.veOlasBalance,
    lockedEnd: balanceData?.lockedEnd,
    canWithdrawVeolas,
    canIncreaseAmountOrUnlock: balanceData ? Number(balanceData.veOlasBalance) > 0 : false,
    refetch,
  };
};
