import { useEffect, useRef, useState } from 'react';
import { getPublicClient, writeContract } from '@wagmi/core';
import type { ReplacementReason } from 'viem';
import { useAccount } from 'wagmi';

import { estimateGasWithBuffer } from 'libs/util-functions/src/lib/estimateGasWithBuffer';

import { MAINNET_CHAIN_ID } from 'common-util/constants/chains';
import { wagmiConfig } from 'common-util/config/wagmi';
import {
  type ClaimBatch,
  type ClaimError,
  isContractRevert,
  prepareClaim,
  toClaimError,
} from 'common-util/functions/staking-incentives-claim';
import type { ClaimableBatchesRefresh } from 'hooks/useClaimableNomineeBatches';

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onError: (error: ClaimError) => void;
  /** Re-reads the claim cursors and resolves to the rebuilt batches. */
  refetchClaimableBatches: () => Promise<ClaimableBatchesRefresh>;
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

  /** Re-reads the cursors; the caller restarts from the first batch only if one moved. */
  const refreshBatches = async () => {
    const refresh = await refetchClaimableBatches();
    if (refresh.cursorsChanged) onBatchesRebuilt();
    return refresh;
  };

  /**
   * Quotes and simulates the batch. A revert with a moved cursor means someone else claimed
   * meanwhile, so the first rebuilt batch is tried once more. A revert with unchanged cursors has
   * another cause and is reported as is.
   */
  const prepareWithOneRebuild = async (batch: ClaimBatch, from: NonNullable<typeof account>) => {
    try {
      return await prepareClaim(batch, from);
    } catch (error) {
      if (!isContractRevert(error)) throw error;
      console.error('Claim simulation reverted', error);
      const { batches, cursorsChanged } = await refreshBatches();
      if (!cursorsChanged) throw error;

      const [rebuiltBatch] = batches;
      if (!rebuiltBatch) return { kind: 'nothing-to-claim' } as const;

      try {
        return await prepareClaim(rebuiltBatch, from);
      } catch (retryError) {
        if (!isContractRevert(retryError)) throw retryError;
        console.error('Claim simulation reverted after the rebuild', retryError);
        const { cursorsChanged: changedAgain } = await refreshBatches();
        if (!changedAgain) throw retryError;
        return { kind: 'claims-changed' } as const;
      }
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
      const publicClient = getPublicClient(wagmiConfig, { chainId: MAINNET_CHAIN_ID });
      if (!publicClient) throw new Error('No Ethereum mainnet client is configured');

      if (mountedRef.current) setIsSending(true);
      const gas = await estimateGasWithBuffer(wagmiConfig, prepared.params);
      const hash = await writeContract(wagmiConfig, { ...prepared.request, gas });
      const replaced: { reason?: ReplacementReason } = {};
      // No timeout: Claim stays disabled until the signed transaction settles, so it cannot be sent twice.
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 0,
        onReplaced: ({ reason }) => {
          replaced.reason = reason;
        },
      });

      const notClaimed: ClaimError | null =
        replaced.reason === 'cancelled'
          ? { kind: 'wallet-rejected' }
          : replaced.reason === 'replaced' || receipt.status === 'reverted'
            ? { kind: 'reverted-after-simulation' }
            : null;
      if (notClaimed) {
        // Never resend this transaction: refresh, and let the user confirm a fresh one.
        console.error(
          `Claim transaction ${hash} did not claim (${replaced.reason ?? receipt.status}); receipt ${receipt.transactionHash}`,
        );
        onError(notClaimed);
        try {
          await refreshBatches();
        } catch (refreshError) {
          console.error('Failed to refresh the claimable batches', refreshError);
        }
        return;
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to claim staking incentives', error);
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
    isPreparing,
  };
};
