import { useEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { getPublicClient, writeContract } from '@wagmi/core';
import {
  type Address,
  type Hex,
  type ReplacementReason,
  type TransactionReceipt,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from 'viem';
import { useAccount } from 'wagmi';

import { type PendingClaim, setPendingClaim } from 'store/govern';
import { type RootState, useAppDispatch, useAppSelector } from 'store/index';
import { MAINNET_CHAIN_ID } from 'common-util/constants/chains';
import { wagmiConfig } from 'common-util/config/wagmi';
import {
  type ClaimBatch,
  type ClaimError,
  getUnclaimedReason,
  isContractRevert,
  prepareClaim,
  toClaimError,
} from 'common-util/functions/staking-incentives-claim';
import type { ClaimableBatchesRefresh } from 'hooks/useClaimableNomineeBatches';

/** Long enough for a congested mainnet; past it the tx is reported as still pending, not resent. */
export const RECEIPT_TIMEOUT_MS = 20 * 60 * 1000;
/** How often an unconfirmed claim's receipt is looked up again while the modal is open. */
export const PENDING_RECEIPT_POLL_MS = 15 * 1000;

/** Numbers each claim, so a claim only clears the hash-less pending entry it set itself. */
let lastClaimRun = 0;

export const stillPendingMessage = (hash: Hex) =>
  `Transaction ${hash} is still pending. Check your wallet before claiming again.`;

/** A claim that failed, or that this hook could not finish on its own. */
export type ClaimNotice =
  | ClaimError
  /** Sent, but with no receipt yet: it may still mine, so nothing else is sent. */
  | { kind: 'still-pending'; message: string }
  /** Another claim from this account is in flight, so this one was not sent. */
  | { kind: 'already-in-flight'; message: string }
  /** The claim settled, but the list could not be re-read afterwards. */
  | { kind: 'refresh-failed'; message: string };

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onError: (error: ClaimNotice) => void;
  /** A claim whose wait ended without a receipt got one later. */
  onLateReceipt: (outcome: { hash: Hex; claimed: boolean }) => void;
  /** Looking up that claim's receipt failed; the claim itself may still mine. */
  onReceiptLookupFailed: (pending: { hash: Hex }) => void;
  /** Re-reads the claim cursors and resolves to the rebuilt batches. */
  refetchClaimableBatches: () => Promise<ClaimableBatchesRefresh>;
  /** The batches were rebuilt, so the caller restarts from the first one. */
  onBatchesRebuilt: () => void;
  recordClaimedBatch: (batch: ClaimBatch) => void;
};

export const useClaimStakingIncentivesBatch = (props: ClaimStakingIncentivesBatchProps) => {
  const { onSuccess, onError, recordClaimedBatch } = props;
  const { address: account } = useAccount();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mountedRef = useRef(true);
  // The poll below outlives a render, so it reports through the latest callbacks.
  const latestProps = useRef(props);
  latestProps.current = props;

  const pending = useAppSelector((state) =>
    account ? state.govern.pendingClaims[account] : undefined,
  );
  const pendingHash = pending && 'hash' in pending ? pending.hash : undefined;
  const unconfirmedHash = pending?.status === 'unconfirmed' ? pending.hash : undefined;

  const setPending = (forAccount: Address, next: PendingClaim | null) =>
    dispatch(setPendingClaim({ account: forAccount, pending: next }));

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshBatches = async () => {
    const refresh = await latestProps.current.refetchClaimableBatches();
    if (refresh.change !== 'none') latestProps.current.onBatchesRebuilt();
    return refresh;
  };

  /** Refreshes after a claim settled outside the normal path, reporting a failed refresh on its own. */
  const refreshReportingFailure = async () => {
    try {
      await refreshBatches();
    } catch (refreshError) {
      console.error('Failed to refresh the claimable batches', refreshError);
      const claimError = toClaimError(refreshError);
      latestProps.current.onError(
        claimError.kind === 'other'
          ? { kind: 'refresh-failed', message: claimError.message }
          : claimError,
      );
    }
  };

  // While a sent claim has no receipt, keep looking: it may still mine, revert or be dropped.
  useEffect(() => {
    if (!account || !unconfirmedHash) return;
    const publicClient = getPublicClient(wagmiConfig, { chainId: MAINNET_CHAIN_ID });
    if (!publicClient) {
      console.error(`No Ethereum mainnet client to check claim transaction ${unconfirmedHash}`);
      return;
    }
    let isActive = true;
    let reportedLookupFailure = false;
    const checkReceipt = async () => {
      let receipt: TransactionReceipt;
      try {
        receipt = await publicClient.getTransactionReceipt({ hash: unconfirmedHash });
      } catch (error) {
        if (error instanceof TransactionReceiptNotFoundError) return;
        console.error(`Could not check claim transaction ${unconfirmedHash}`, error);
        // Once while the modal is open: the poll keeps trying, but the user should know.
        if (isActive && !reportedLookupFailure) {
          reportedLookupFailure = true;
          latestProps.current.onReceiptLookupFailed({ hash: unconfirmedHash });
        }
        return;
      }
      if (!isActive) return;
      isActive = false;
      dispatch(setPendingClaim({ account, pending: null }));
      const claimed = getUnclaimedReason(receipt) === null;
      if (!claimed) console.error(`Claim transaction ${unconfirmedHash} reverted`);
      latestProps.current.onLateReceipt({ hash: unconfirmedHash, claimed });
      await refreshReportingFailure();
    };
    checkReceipt();
    const timer = setInterval(checkReceipt, PENDING_RECEIPT_POLL_MS);
    return () => {
      isActive = false;
      clearInterval(timer);
    };
    // refreshReportingFailure reads its callbacks through latestProps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, unconfirmedHash, dispatch]);

  /**
   * Refreshes after a simulation revert. A failed refresh is logged and the revert is rethrown
   * as is, so the user learns the claim would have reverted. (Setting the refresh error as its
   * `cause` would break the viem error chain the revert is decoded from.)
   */
  const refreshAfterRevert = async (revert: unknown) => {
    try {
      return await refreshBatches();
    } catch (refreshError) {
      console.error('Failed to refresh the claimable batches after a revert', refreshError);
      throw revert;
    }
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
      const { batches, change } = await refreshAfterRevert(error);
      if (change !== 'concurrent') throw error;

      const [rebuiltBatch] = batches;
      if (!rebuiltBatch) return { kind: 'nothing-to-claim' } as const;

      try {
        return await prepareClaim(rebuiltBatch, from);
      } catch (retryError) {
        if (!isContractRevert(retryError)) throw retryError;
        console.error('Claim simulation reverted after the rebuild', retryError);
        const refreshed = await refreshAfterRevert(retryError);
        if (refreshed.change !== 'concurrent') throw retryError;
        return refreshed.batches.length === 0
          ? ({ kind: 'nothing-to-claim' } as const)
          : ({ kind: 'claims-changed' } as const);
      }
    }
  };

  const claimIncentivesForBatch = async (batch: ClaimBatch) => {
    if (!account) {
      onError({ kind: 'other', message: 'Connect a wallet to claim' });
      return;
    }
    // Read from the store, not the render, so a second click before the re-render is refused.
    const inFlight = store.getState().govern.pendingClaims[account];
    if (inFlight) {
      onError({
        kind: 'already-in-flight',
        message:
          'hash' in inFlight
            ? stillPendingMessage(inFlight.hash)
            : 'A claim is already being prepared. Finish it in your wallet first.',
      });
      return;
    }
    lastClaimRun += 1;
    const run = lastClaimRun;
    setPending(account, { status: 'preparing', run });
    // A dismissed entry may since belong to a newer claim, whose guard must stay.
    const clearOwnEntry = () => {
      const current = store.getState().govern.pendingClaims[account];
      if (current && 'run' in current && current.run === run) setPending(account, null);
    };

    let hash: Hex | undefined;
    try {
      if (mountedRef.current) setIsPreparing(true);
      const prepared = await prepareWithOneRebuild(batch, account).finally(() => {
        if (mountedRef.current) setIsPreparing(false);
      });
      if ('kind' in prepared) {
        clearOwnEntry();
        onError(prepared);
        return;
      }

      // viem's receipt action, not wagmi's: wagmi throws on a reverted receipt instead of returning it.
      const publicClient = getPublicClient(wagmiConfig, { chainId: MAINNET_CHAIN_ID });
      if (!publicClient) throw new Error('No Ethereum mainnet client is configured');

      if (mountedRef.current) setIsSending(true);
      setPending(account, { status: 'sending', run });
      hash = await writeContract(wagmiConfig, prepared.request);
      setPending(account, { status: 'waiting', hash });

      let replacedReason: ReplacementReason | undefined;
      let receipt: TransactionReceipt;
      try {
        receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: RECEIPT_TIMEOUT_MS,
          onReplaced: ({ reason }) => {
            replacedReason = reason;
          },
        });
      } catch (waitError) {
        // The transaction may still mine, so it stays pending and Claim does not send another.
        setPending(account, { status: 'unconfirmed', hash });
        console.error(`Could not confirm claim transaction ${hash}`, waitError);
        onError({
          kind: 'still-pending',
          message:
            waitError instanceof WaitForTransactionReceiptTimeoutError
              ? stillPendingMessage(hash)
              : `Could not confirm transaction ${hash}. Check your wallet before claiming again.`,
        });
        return;
      }
      setPending(account, null);

      const notClaimed = getUnclaimedReason(receipt, replacedReason);
      if (notClaimed) {
        console.error(
          `Claim transaction ${hash} did not claim (${replacedReason ?? receipt.status}); receipt ${receipt.transactionHash}`,
        );
        onError(notClaimed);
        await refreshReportingFailure();
        return;
      }
      recordClaimedBatch(prepared.batch);
      onSuccess();
    } catch (error) {
      // Nothing was sent, so nothing can mine: the next Claim may send.
      if (!hash) clearOwnEntry();
      console.error(`Failed to claim staking incentives${hash ? ` (tx ${hash})` : ''}`, error);
      onError(toClaimError(error));
    } finally {
      if (mountedRef.current) {
        setIsPreparing(false);
        setIsSending(false);
      }
    }
  };

  /**
   * A `sending` claim this mount is not sending was left by an earlier mount whose wallet has
   * not answered. A `preparing` one is not: its run is still going and will reach the wallet.
   */
  const isStaleSending = pending?.status === 'sending' && !isSending;
  const canDismissPendingClaim = unconfirmedHash !== undefined || isStaleSending;

  /** For a hash the wallet replaced or dropped, or a wallet request that was never answered. */
  const dismissPendingClaim = () => {
    if (account && canDismissPendingClaim) setPending(account, null);
  };

  return {
    claimIncentivesForBatch,
    dismissPendingClaim,
    isPending: isPreparing || isSending || pending !== undefined,
    isPreparing,
    pendingHash,
    canDismissPendingClaim,
  };
};
