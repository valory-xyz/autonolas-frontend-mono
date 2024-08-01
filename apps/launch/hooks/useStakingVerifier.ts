// import { ethers } from 'ethers';
import { useMemo } from 'react';
import { Address } from 'viem';
import { useReadContract } from 'wagmi';

import {
  STAKING_FACTORY,
  STAKING_VERIFIER,
} from 'libs/util-contracts/src/lib/abiAndAddresses';

import { useAppSelector } from 'store/index';

export const useStakingContractVerifierHelper = <T>({
  name = 'timeForEmissionsLimit',
}: // select,
{
  name: string;
  // select?: (data: unknown) => T;
}) => {
  const { networkId } = useAppSelector((state) => state.network);

  const { data: verifierAddress } = useReadContract({
    address: (STAKING_FACTORY.addresses as Record<number, Address>)[networkId as number],
    abi: STAKING_FACTORY.abi,
    chainId: networkId as number,
    functionName: 'verifier',
  });

  const { data, isLoading } = useReadContract({
    address: verifierAddress as Address,
    abi: STAKING_VERIFIER.abi,
    chainId: networkId as number,
    functionName: name,
    query: {
      enabled: !!verifierAddress,
      // select:
      //   select ||
      //   (((data) => {
      //     if (typeof data === 'bigint') return data.toString();
      //     return data;
      //   }) as (data: unknown) => T),
    },
  });

  return { data, isLoading };
};

export const useTimeForEmissionsLimit = () => {
  const { data, ...rest } = useStakingContractVerifierHelper<number>({
    name: 'timeForEmissionsLimit',
  });

  const timeForEmissionsLimit = useMemo(() => {
    if (typeof data === 'bigint') return Number(data);
    return 0;
  }, [data]);

  return { timeForEmissionsLimit, ...rest };
};
