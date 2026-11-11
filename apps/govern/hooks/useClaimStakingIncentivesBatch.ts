import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useWriteContract } from 'wagmi';

import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getArbitrumBridgePayload, isOrbitChainId } from 'common-util/functions/arbitrum-bridge';

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

    // Orbit chains (Arbitrum One, Robinhood Chain) bridge through retryable tickets and need
    // a gas-priced payload plus ETH; every other chain claims with `0x` and zero value.
    const orbitClaims = chainIds.flatMap((chainId, index) =>
      isOrbitChainId(chainId) ? [{ chainId, index }] : [],
    );

    if (orbitClaims.length > 0) {
      if (mountedRef.current) setIsEstimating(true);
      try {
        // Each estimate is several RPC round-trips, so run the chains concurrently.
        const estimates = await Promise.all(
          orbitClaims.map(({ chainId, index }) =>
            getArbitrumBridgePayload(stakingTargets[index], chainId).then((result) => ({
              ...result,
              index,
            })),
          ),
        );
        for (const { index, bridgePayload, value } of estimates) {
          bridgePayloads[index] = bridgePayload;
          valueAmounts[index] = value;
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Failed to estimate bridge gas'));
        return;
      } finally {
        if (mountedRef.current) setIsEstimating(false);
      }
    }

    const totalValue = valueAmounts.reduce((sum, v) => sum + v, BigInt(0));

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
