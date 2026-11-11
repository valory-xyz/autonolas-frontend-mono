import { ethers } from 'ethers';
import { Abi } from 'viem';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';

import { TOKENOMICS, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { VOTE_WEIGHTING_ADDRESS } from 'common-util/constants/addresses';
import { useMemo } from 'react';
import { Nominee } from 'types';

type Weight = { percentage: number; value: number };

const TOKENOMICS_CONTRACT = {
  address: TOKENOMICS.addresses[mainnet.id],
  abi: TOKENOMICS.abi,
  chainId: mainnet.id,
} as const;

const TOKENOMICS_READS = ['epochCounter', 'epochLen', 'inflationPerSecond'] as const;

const useStakingInflation = () => {
  const { data: tokenomicsData, error: tokenomicsError } = useReadContracts({
    contracts: TOKENOMICS_READS.map((functionName) => ({ ...TOKENOMICS_CONTRACT, functionName })),
    query: {
      select: (data) => {
        const [epoch, epochLen, inflationPerSecond] = data.map((item) => {
          if (item.status !== 'success') {
            return null;
          }

          return item.result;
        });
        const failedReads = TOKENOMICS_READS.filter((_, i) => data[i]?.status !== 'success');

        return { epoch, epochLen, inflationPerSecond, failedReads };
      },
    },
  });

  // Get epoch inflation
  const { data: stakingPoint, error: stakingPointError } = useReadContract({
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

  // Without the inflation the weights read never runs, so its failure must surface here.
  const failedReads = tokenomicsData?.failedReads.join(', ');
  const error = useMemo(
    () =>
      tokenomicsError ??
      stakingPointError ??
      (failedReads ? new Error(`Could not read the staking inflation (${failedReads})`) : null),
    [tokenomicsError, stakingPointError, failedReads],
  );

  return { projectedInflation, error };
};

export const useNomineesWeights = (
  nominees: Nominee[],
  timestamp: number | null,
  scopeKey?: string,
) => {
  const { projectedInflation, error: inflationError } = useStakingInflation();

  const contracts = nominees.map((nominee) => ({
    address: VOTE_WEIGHTING_ADDRESS,
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    // There may be cases where no one voted on the contract during the week,
    // meaning their weights won't be in the contract state for the provided timestamp.
    // Use nomineeRelativeWeightWrite instead of nomineeRelativeWeight for accuracy.
    functionName: 'nomineeRelativeWeightWrite',
    args: [nominee.account, nominee.chainId, timestamp],
  }));

  const { data, error } = useReadContracts({
    contracts,
    scopeKey,
    query: {
      enabled: nominees.length > 0 && timestamp !== null && !!projectedInflation,
      select: (data) => {
        if (!projectedInflation) return;

        // A nominee whose read failed is left out, so the map is partial.
        return data.reduce((res: Partial<Record<Address, Weight>>, item, index) => {
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

  return { data, error: inflationError ?? error };
};
