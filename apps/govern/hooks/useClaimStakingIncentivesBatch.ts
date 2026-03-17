import { useState } from 'react';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useWriteContract } from 'wagmi';

import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { ARBITRUM_CHAIN_ID, getArbitrumBridgePayload } from './useArbitrumBridgePayload';

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

  const claimIncentivesForBatch = async (batch: [number[], Address[][]]) => {
    const [chainIds, stakingTargets] = batch;

    const bridgePayloads: `0x${string}`[] = [];
    const valueAmounts: bigint[] = [];

    const hasArbitrum = chainIds.includes(ARBITRUM_CHAIN_ID);

    if (hasArbitrum) {
      setIsEstimating(true);
      try {
        for (let i = 0; i < chainIds.length; i++) {
          if (chainIds[i] === ARBITRUM_CHAIN_ID) {
            const { bridgePayload, value } = await getArbitrumBridgePayload(stakingTargets[i]);
            bridgePayloads.push(bridgePayload);
            valueAmounts.push(value);
          } else {
            bridgePayloads.push('0x');
            valueAmounts.push(BigInt(0));
          }
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Failed to estimate Arbitrum gas'));
        return;
      } finally {
        setIsEstimating(false);
      }
    } else {
      for (let i = 0; i < chainIds.length; i++) {
        bridgePayloads.push('0x');
        valueAmounts.push(BigInt(0));
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

  return { claimIncentivesForBatch, isPending: isWritePending || isEstimating };
};
