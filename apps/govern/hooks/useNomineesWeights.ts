import { ethers } from 'ethers';
import { Abi } from 'viem';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';

import { TOKENOMICS, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { useMemo } from 'react';
import { Nominee } from 'types';

type Weight = { percentage: number; value: number };

const TOKENOMICS_CONTRACT = {
  address: TOKENOMICS.addresses[mainnet.id],
  abi: TOKENOMICS.abi,
  chainId: mainnet.id,
} as const;

const useStakingInflation = () => {
  const { data: tokenomicsData } = useReadContracts({
    contracts: [
      {
        ...TOKENOMICS_CONTRACT,
        functionName: 'epochCounter',
      },
      { ...TOKENOMICS_CONTRACT, functionName: 'epochLen' },
      { ...TOKENOMICS_CONTRACT, functionName: 'inflationPerSecond' },
    ],
    query: {
      select: (data) => {
        const [epoch, epochLen, inflationPerSecond] = data.map((item) => {
          if (item.status !== 'success') {
            return null;
          }

          return item.result;
        });

        return { epoch, epochLen, inflationPerSecond };
      },
    },
  });

  // Get epoch inflation
  const { data: stakingPoint } = useReadContract({
    address: TOKENOMICS.addresses[mainnet.id],
    abi: TOKENOMICS.abi,
    chainId: mainnet.id,
    functionName: 'mapEpochStakingPoints',
    args: tokenomicsData?.epoch ? [BigInt(tokenomicsData.epoch)] : undefined,
    query: {
      enabled: !!tokenomicsData?.epoch,
      select: (data) => {
        const [stakingIncentive, maxStakingIncentive, minStakingWeight, stakingFraction] = data;
        return { stakingIncentive, maxStakingIncentive, minStakingWeight, stakingFraction };
      },
    },
  });

  const projectedInflation = useMemo(() => {
    if (!tokenomicsData) return;
    if (!stakingPoint) return;
    const { stakingIncentive: initialStakingInflation, stakingFraction } = stakingPoint;
    const { epochLen, inflationPerSecond } = tokenomicsData;

    if (!epochLen || !inflationPerSecond) return;

    const result =
      BigInt(initialStakingInflation) +
      (BigInt(epochLen) * BigInt(inflationPerSecond) * BigInt(stakingFraction)) / BigInt(100);

    return result;
  }, [tokenomicsData, stakingPoint]);

  return { projectedInflation };
};

export const useNomineesWeights = (
  nominees: Nominee[],
  timestamp: number | null,
  scopeKey?: string,
) => {
  const { projectedInflation } = useStakingInflation();

  const contracts = nominees.map((nominee) => ({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    // There may be cases where no one voted on the contract during the week,
    // meaning their weights won't be in the contract state for the provided timestamp.
    // Use nomineeRelativeWeightWrite instead of nomineeRelativeWeight for accuracy.
    functionName: 'nomineeRelativeWeightWrite',
    args: [nominee.account, nominee.chainId, timestamp],
  }));

  const { data } = useReadContracts({
    contracts,
    scopeKey,
    query: {
      enabled: nominees.length > 0 && timestamp !== null && !!projectedInflation,
      select: (data) => {
        if (!projectedInflation) return;

        return data.reduce((res: Record<Address, Weight>, item, index) => {
          if (item.status === 'success' && item.result) {
            const [weight, totalSum] = item.result as number[];

            // For correct weight calculation need to
            // take staking inflation into account
            const totalSumMultiplier =
              projectedInflation < totalSum ? projectedInflation : totalSum;

            res[nominees[index].account] = {
              percentage: Number(ethers.formatUnits(weight, 16)),
              value:
                Number(ethers.formatUnits(weight, 18)) *
                Number(ethers.formatUnits(totalSumMultiplier, 18)),
            };
          }
          return res;
        }, {});
      },
    },
  });

  return { data };
};
