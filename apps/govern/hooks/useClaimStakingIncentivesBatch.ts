import { useEffect, useRef, useState } from 'react';
import { getPublicClient, writeContract } from '@wagmi/core';
import { mainnet } from 'viem/chains';
import { useAccount } from 'wagmi';

import { estimateGasWithBuffer } from 'libs/util-functions/src/lib/estimateGasWithBuffer';

import { wagmiConfig } from 'common-util/config/wagmi';
import {
  type ClaimBatch,
  type ClaimError,
  isContractRevert,
  prepareClaim,
  toClaimError,
} from 'common-util/functions/staking-incentives-claim';

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onError: (error: ClaimError) => void;
  /** Re-reads the claim cursors and resolves to the rebuilt batches. */
  refetchClaimableBatches: () => Promise<ClaimBatch[]>;
  /** The batches were rebuilt, so the caller restarts from the first one. */
  onBatchesRebuilt: () => void;
};

export const useClaimStakingIncentivesBatch = ({
  onSuccess,
  onError,
  refetchClaimableBatches,
  onBatchesRebuilt,
}: ClaimStakingIncentivesBatchProps) => {
  const { address: account } = useAccount();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const rebuildBatches = async () => {
    const batches = await refetchClaimableBatches();
    onBatchesRebuilt();
    return batches;
  };

  /**
   * Quotes and simulates the batch. A revert usually means someone else claimed meanwhile, so the
   * batches are rebuilt from fresh cursors and the first one is tried once more.
   */
  const prepareWithOneRebuild = async (batch: ClaimBatch, from: NonNullable<typeof account>) => {
    try {
      return await prepareClaim(batch, from);
    } catch (error) {
      if (!isContractRevert(error)) throw error;
    }

    const [rebuiltBatch] = await rebuildBatches();
    if (!rebuiltBatch) return { kind: 'nothing-to-claim' } as const;

    try {
      return await prepareClaim(rebuiltBatch, from);
    } catch (error) {
      if (!isContractRevert(error)) throw error;
      await rebuildBatches();
      return { kind: 'claims-changed' } as const;
    }
  };

  const claimIncentivesForBatch = async (batch: ClaimBatch) => {
    if (!account) {
      onError({ kind: 'other', message: 'Connect a wallet to claim' });
      return;
    }

    try {
      if (mountedRef.current) setIsPreparing(true);
      const prepared = await prepareWithOneRebuild(batch, account).finally(() => {
        if (mountedRef.current) setIsPreparing(false);
      });
      if ('kind' in prepared) {
        onError(prepared);
        return;
      }

      // viem's receipt action, not wagmi's: wagmi throws on a reverted receipt instead of returning it.
      const publicClient = getPublicClient(wagmiConfig, { chainId: mainnet.id });
      if (!publicClient) throw new Error('No Ethereum mainnet client is configured');

      if (mountedRef.current) setIsSending(true);
      const gas = await estimateGasWithBuffer(wagmiConfig, prepared.params);
      const hash = await writeContract(wagmiConfig, { ...prepared.request, gas });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'reverted') {
        // Never resend this transaction: rebuild, and let the user confirm a fresh one.
        await rebuildBatches();
        onError({ kind: 'reverted-after-simulation' });
        return;
      }
      onSuccess();
    } catch (error) {
      onError(toClaimError(error));
    } finally {
      if (mountedRef.current) {
        setIsPreparing(false);
        setIsSending(false);
      }
    }
  };

  return {
    claimIncentivesForBatch,
    isPending: isPreparing || isSending,
    isEstimating: isPreparing,
  };
};
