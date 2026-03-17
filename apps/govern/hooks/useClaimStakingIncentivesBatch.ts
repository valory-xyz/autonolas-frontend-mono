import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useWriteContract } from 'wagmi';

import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { ARBITRUM_CHAIN_ID, getArbitrumBridgePayload } from 'common-util/functions/arbitrum-bridge';

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onError: (error: Error) => void;
};

export const useClaimStakingIncentivesBatch = ({
  onSuccess,
  onError,
}: ClaimStakingIncentivesBatchProps) => {
  const { writeContract, isPending: isWritePending } = useWriteContract();
  const [isEstimating, setIsEstimating] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const claimIncentivesForBatch = async (batch: [number[], Address[][]]) => {
    const [chainIds, stakingTargets] = batch;

    const bridgePayloads: `0x${string}`[] = chainIds.map(() => '0x');
    const valueAmounts: bigint[] = chainIds.map(() => BigInt(0));

    const arbIndex = chainIds.indexOf(ARBITRUM_CHAIN_ID);
    const hasArbitrum = arbIndex !== -1;

    if (hasArbitrum) {
      if (mountedRef.current) setIsEstimating(true);
      try {
        const { bridgePayload, value } = await getArbitrumBridgePayload(stakingTargets[arbIndex]);
        bridgePayloads[arbIndex] = bridgePayload;
        valueAmounts[arbIndex] = value;
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Failed to estimate Arbitrum gas'));
        return;
      } finally {
        if (mountedRef.current) setIsEstimating(false);
      }
    }

    const totalValue = valueAmounts.reduce((sum, v) => sum + v, BigInt(0));

    console.log('bridgePayloads', bridgePayloads);
    return writeContract(
      {
        address: DISPENSER.addresses[mainnet.id],
        abi: DISPENSER.abi,
        chainId: mainnet.id,
        functionName: 'claimStakingIncentivesBatch',
        args: [
          BigInt(1), // numClaimedEpochs
          chainIds.map((id) => BigInt(id)),
          stakingTargets,
          bridgePayloads,
          valueAmounts,
        ],
        value: totalValue,
      },
      { onSuccess, onError },
    );
  };

  return { claimIncentivesForBatch, isPending: isWritePending || isEstimating, isEstimating };
};
