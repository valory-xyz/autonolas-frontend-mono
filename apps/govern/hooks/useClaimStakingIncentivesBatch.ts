import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getPublicClient, writeContract } from '@wagmi/core';
import {
  type Address,
  type Hex,
  type ReplacementReason,
  WaitForTransactionReceiptTimeoutError,
} from 'viem';
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

/** Long enough for a congested mainnet; past it the tx is reported as still pending, not resent. */
export const RECEIPT_TIMEOUT_MS = 20 * 60 * 1000;

type PendingClaim = { hash: Hex; isWaiting: boolean };

// Kept outside the modal: closing and reopening it must not allow a second, identical claim.
const pendingClaims = new Map<Address, PendingClaim>();
const pendingListeners = new Set<() => void>();
const setPendingClaim = (account: Address, pending: PendingClaim | null) => {
  if (pending) pendingClaims.set(account, pending);
  else pendingClaims.delete(account);
  pendingListeners.forEach((listener) => listener());
};
const subscribeToPendingClaims = (listener: () => void) => {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
};

/** Test-only: forget every pending claim. */
export const resetPendingClaims = () => pendingClaims.clear();

const stillPendingMessage = (hash: Hex) =>
  `Transaction ${hash} is still pending. Check your wallet before claiming again.`;

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onError: (error: ClaimError) => void;
  /** Re-reads the claim cursors and resolves to the rebuilt batches. */
  refetchClaimableBatches: () => Promise<ClaimableBatchesRefresh>;
  /** The batches were rebuilt, so the caller restarts from the first one. */
  onBatchesRebuilt: () => void;
  /** A claim was confirmed, so its cursor moves are this user's own. */
  recordClaimedBatch: (batch: ClaimBatch) => void;
};

export const useClaimStakingIncentivesBatch = ({
  onSuccess,
  onError,
  refetchClaimableBatches,
  onBatchesRebuilt,
  recordClaimedBatch,
}: ClaimStakingIncentivesBatchProps) => {
  const { address: account } = useAccount();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mountedRef = useRef(true);
  const pendingHash = useSyncExternalStore(
    subscribeToPendingClaims,
    () => (account ? pendingClaims.get(account)?.hash : undefined),
    () => undefined,
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A claim whose wait ended without a receipt clears once a receipt exists.
  useEffect(() => {
    const pending = account ? pendingClaims.get(account) : undefined;
    if (!account || !pending || pending.isWaiting) return;
    getPublicClient(wagmiConfig, { chainId: MAINNET_CHAIN_ID })
      ?.getTransactionReceipt({ hash: pending.hash })
      .then(() => setPendingClaim(account, null))
      .catch((error) => console.warn(`Claim transaction ${pending.hash} has no receipt yet`, error));
  }, [account]);

  const refreshBatches = async () => {
    const refresh = await refetchClaimableBatches();
    if (refresh.cursorsChanged) onBatchesRebuilt();
    return refresh;
  };

  /**
   * Quotes and simulates the batch. A revert with a moved cursor means someone else claimed
   * meanwhile, so the first rebuilt batch is tried once more.
   */
  const prepareWithOneRebuild = async (batch: ClaimBatch, from: Address) => {
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
    const pending = pendingClaims.get(account);
    if (pending) {
      onError({ kind: 'other', message: stillPendingMessage(pending.hash) });
      return;
    }

    let hash: Hex | undefined;
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
      hash = await writeContract(wagmiConfig, { ...prepared.request, gas });
      setPendingClaim(account, { hash, isWaiting: true });

      const replaced: { reason?: ReplacementReason } = {};
      let receipt;
      try {
        receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: RECEIPT_TIMEOUT_MS,
          onReplaced: ({ reason }) => {
            replaced.reason = reason;
          },
        });
      } catch (waitError) {
        // The transaction may still mine, so it stays pending and Claim does not send another.
        setPendingClaim(account, { hash, isWaiting: false });
        console.error(`Could not confirm claim transaction ${hash}`, waitError);
        onError({
          kind: 'other',
          message:
            waitError instanceof WaitForTransactionReceiptTimeoutError
              ? stillPendingMessage(hash)
              : `Could not confirm transaction ${hash}. Check your wallet before claiming again.`,
        });
        return;
      }
      setPendingClaim(account, null);

      const notClaimed: ClaimError | null =
        replaced.reason === 'cancelled'
          ? { kind: 'wallet-rejected' }
          : replaced.reason === 'replaced' || receipt.status === 'reverted'
            ? { kind: 'reverted-after-simulation' }
            : null;
      if (notClaimed) {
        console.error(
          `Claim transaction ${hash} did not claim (${replaced.reason ?? receipt.status}); receipt ${receipt.transactionHash}`,
        );
        onError(notClaimed);
        try {
          await refreshBatches();
        } catch (refreshError) {
          console.error('Failed to refresh the claimable batches', refreshError);
          onError({
            kind: 'other',
            message: `Could not refresh the claim list: ${toClaimErrorMessage(refreshError)}`,
          });
        }
        return;
      }
      recordClaimedBatch([
        prepared.quotes.map(({ chainId }) => chainId),
        prepared.quotes.map(({ targets }) => targets),
      ]);
      onSuccess();
    } catch (error) {
      console.error(`Failed to claim staking incentives${hash ? ` (tx ${hash})` : ''}`, error);
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
    isPending: isPreparing || isSending || pendingHash !== undefined,
    isPreparing,
    pendingHash,
  };
};

const toClaimErrorMessage = (error: unknown) => {
  const claimError = toClaimError(error);
  return claimError.kind === 'other' ? claimError.message : claimError.kind;
};
