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

import {
  type PendingClaim,
  type PendingClaimStatus,
  recordOwnClaims,
  setPendingClaim,
} from 'store/govern';
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
import type { ClaimableBatchesRefresh, Cursors } from 'common-util/functions/claim-batches';

/** Long enough for a congested mainnet; past it the tx is reported as still pending, not resent. */
export const RECEIPT_TIMEOUT_MS = 20 * 60 * 1000;
/** How often an unconfirmed claim's receipt is looked up again while the modal is open. */
export const PENDING_RECEIPT_POLL_MS = 15 * 1000;

/** Source of each claim's run (see `PendingClaim`). */
let lastClaimRun = 0;

const NO_PENDING_CLAIMS: PendingClaim[] = [];

const isSent = (entry: PendingClaim): entry is Extract<PendingClaim, { hash: Hex }> =>
  'hash' in entry;

export const stillPendingMessage = (hash: Hex) =>
  `Transaction ${hash} is still pending. Check your wallet before claiming again.`;

export type ClaimButtonState = 'idle' | 'preparing' | 'pending';

/** A claim that failed, or that this hook could not finish on its own. */
export type ClaimNotice =
  | ClaimError
  | { kind: 'still-pending'; hash: Hex; timedOut: boolean }
  | { kind: 'already-in-flight'; message: string }
  | { kind: 'refresh-failed'; message: string };

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onNotice: (notice: ClaimNotice) => void;
  /** A claim whose wait ended without a receipt got one later. */
  onLateReceipt: (outcome: { hash: Hex; claimed: boolean }) => void;
  /** Looking up that claim's receipt failed; the claim itself may still mine. */
  onReceiptLookupFailed: (pending: { hash: Hex }) => void;
  /** Re-reads the claim cursors and resolves to the rebuilt batches. */
  refetchClaimableBatches: () => Promise<ClaimableBatchesRefresh>;
  /** The batches were rebuilt, so the caller restarts from the first one. */
  onBatchesRebuilt: () => void;
  /** The cursors a confirmed claim of `batch` moves its targets to (see `recordOwnClaims`). */
  getClaimedThrough: (batch: ClaimBatch) => Cursors;
};

export const useClaimStakingIncentivesBatch = (props: ClaimStakingIncentivesBatchProps) => {
  const { onSuccess, onNotice, getClaimedThrough } = props;
  const { address: account } = useAccount();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'sending'>('idle');
  const mountedRef = useRef(true);
  const ownRuns = useRef(new Set<number>());
  // The poll below outlives a render, so it reports through the latest callbacks.
  const latestProps = useRef(props);
  latestProps.current = props;

  const pendingClaims =
    useAppSelector((state) => (account ? state.govern.pendingClaims[account] : undefined)) ??
    NO_PENDING_CLAIMS;
  const pendingHash = pendingClaims.find(isSent)?.hash;
  const unconfirmed = pendingClaims.filter(isSent).filter(({ status }) => status === 'unconfirmed');
  const unconfirmedKey = unconfirmed.map(({ run, hash }) => `${run}:${hash}`).join(',');

  const setPending = (forAccount: Address, run: number, next: PendingClaimStatus | null) =>
    dispatch(setPendingClaim({ account: forAccount, run, pending: next }));

  // Recorded before the entry clears, so no refresh, in this mount or another, reads the cursors
  // the claim moved as someone else's.
  const settleClaimed = (forAccount: Address, run: number, claimedThrough: Cursors) => {
    dispatch(recordOwnClaims(claimedThrough));
    setPending(forAccount, run, null);
  };

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

  const refreshReportingFailure = async () => {
    try {
      await refreshBatches();
    } catch (refreshError) {
      console.error('Failed to refresh the claimable batches', refreshError);
      const claimError = toClaimError(refreshError);
      latestProps.current.onNotice(
        claimError.kind === 'other'
          ? { kind: 'refresh-failed', message: claimError.message }
          : claimError,
      );
    }
  };

  // Once the receipt wait has given up, keep looking: the claim may still mine or revert.
  useEffect(() => {
    if (!account || unconfirmed.length === 0) return;
    const publicClient = getPublicClient(wagmiConfig, { chainId: MAINNET_CHAIN_ID });
    if (!publicClient) {
      console.error(`No Ethereum mainnet client to check claim transaction ${unconfirmed[0].hash}`);
      return;
    }
    let isActive = true;
    const settled = new Set<number>();
    const reportedLookupFailure = new Set<number>();
    const checkReceipt = async ({ run, hash, claimedThrough }: (typeof unconfirmed)[number]) => {
      let receipt: TransactionReceipt;
      try {
        receipt = await publicClient.getTransactionReceipt({ hash });
      } catch (error) {
        if (error instanceof TransactionReceiptNotFoundError) return;
        console.error(`Could not check claim transaction ${hash}`, error);
        // Once per hash while this poll runs: it keeps trying, but the user should know.
        if (isActive && !reportedLookupFailure.has(run)) {
          reportedLookupFailure.add(run);
          latestProps.current.onReceiptLookupFailed({ hash });
        }
        return;
      }
      if (!isActive || settled.has(run)) return;
      settled.add(run);
      const claimed = getUnclaimedReason(receipt) === null;
      if (claimed) settleClaimed(account, run, claimedThrough);
      else setPending(account, run, null);
      if (!claimed) console.error(`Claim transaction ${hash} reverted`);
      latestProps.current.onLateReceipt({ hash, claimed });
      await refreshReportingFailure();
    };
    const checkAll = () => unconfirmed.forEach(checkReceipt);
    checkAll();
    const timer = setInterval(checkAll, PENDING_RECEIPT_POLL_MS);
    return () => {
      isActive = false;
      clearInterval(timer);
    };
    // `unconfirmedKey` stands for `unconfirmed`; refreshReportingFailure reads its callbacks
    // through latestProps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, unconfirmedKey, dispatch]);

  // A claim an earlier mount sent and is still awaiting settles there, whose callbacks belong to
  // the closed modal, so this mount refreshes its own list.
  const previousClaims = useRef({ account, claims: pendingClaims });
  useEffect(() => {
    const previous = previousClaims.current;
    previousClaims.current = { account, claims: pendingClaims };
    if (previous.account !== account) return;
    const settledElsewhere = previous.claims.some(
      (entry) =>
        entry.status === 'waiting' &&
        !ownRuns.current.has(entry.run) &&
        !pendingClaims.some(({ run }) => run === entry.run),
    );
    if (settledElsewhere) refreshReportingFailure();
    // refreshReportingFailure reads its callbacks through latestProps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, pendingClaims]);

  /** The rebuilt batches after a revert from a `concurrent` change; rethrows anything else. */
  const batchesAfterConcurrentRevert = async (error: unknown, logMessage: string) => {
    if (!isContractRevert(error)) throw error;
    console.error(logMessage, error);
    // The revert is rethrown as is: the refresh error as its `cause` would break viem's decoding.
    const { batches, change } = await refreshBatches().catch((refreshError: unknown) => {
      console.error('Failed to refresh the claimable batches after a revert', refreshError);
      throw error;
    });
    if (change !== 'concurrent') throw error;
    return batches;
  };

  /** After a revert, a `concurrent` cursor change rebuilds once and retries the first batch. */
  const prepareWithOneRebuild = async (batch: ClaimBatch, from: Address) => {
    try {
      return await prepareClaim(batch, from);
    } catch (error) {
      const [rebuiltBatch] = await batchesAfterConcurrentRevert(error, 'Claim simulation reverted');
      if (!rebuiltBatch) return { kind: 'nothing-to-claim' } as const;

      try {
        return await prepareClaim(rebuiltBatch, from);
      } catch (retryError) {
        const remaining = await batchesAfterConcurrentRevert(
          retryError,
          'Claim simulation reverted after the rebuild',
        );
        return remaining.length === 0
          ? ({ kind: 'nothing-to-claim' } as const)
          : ({ kind: 'claims-changed' } as const);
      }
    }
  };

  const claimIncentivesForBatch = async (batch: ClaimBatch) => {
    if (!account) {
      onNotice({ kind: 'other', message: 'Connect a wallet to claim' });
      return;
    }
    // Read from the store, not the render, so a second click before the re-render is refused.
    const inFlight = store.getState().govern.pendingClaims[account];
    if (inFlight?.length) {
      const sentHash = inFlight.find(isSent)?.hash;
      onNotice({
        kind: 'already-in-flight',
        message: sentHash
          ? stillPendingMessage(sentHash)
          : 'A claim is already being prepared. Finish it in your wallet first.',
      });
      return;
    }
    lastClaimRun += 1;
    const run = lastClaimRun;
    ownRuns.current.add(run);
    const writeOwnEntry = (next: PendingClaimStatus | null) => setPending(account, run, next);
    writeOwnEntry({ status: 'preparing' });

    let hash: Hex | undefined;
    try {
      if (mountedRef.current) setPhase('preparing');
      const prepared = await prepareWithOneRebuild(batch, account);
      if ('kind' in prepared) {
        writeOwnEntry(null);
        onNotice(prepared);
        return;
      }

      // viem's receipt action, not wagmi's: wagmi throws on a reverted receipt instead of returning it.
      const publicClient = getPublicClient(wagmiConfig, { chainId: MAINNET_CHAIN_ID });
      if (!publicClient) throw new Error('No Ethereum mainnet client is configured');

      // From the cursors this batch was simulated against, before any confirmation can move them.
      const claimedThrough = getClaimedThrough(prepared.batch);
      if (mountedRef.current) setPhase('sending');
      writeOwnEntry({ status: 'sending' });
      hash = await writeContract(wagmiConfig, prepared.request);
      writeOwnEntry({ status: 'waiting', hash, claimedThrough });

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
        writeOwnEntry({ status: 'unconfirmed', hash, claimedThrough });
        console.error(`Could not confirm claim transaction ${hash}`, waitError);
        onNotice({
          kind: 'still-pending',
          hash,
          timedOut: waitError instanceof WaitForTransactionReceiptTimeoutError,
        });
        return;
      }
      const notClaimed = getUnclaimedReason(receipt, replacedReason);
      if (notClaimed) writeOwnEntry(null);
      else settleClaimed(account, run, claimedThrough);
      if (notClaimed) {
        console.error(
          `Claim transaction ${hash} did not claim (${replacedReason ?? receipt.status}); receipt ${receipt.transactionHash}`,
        );
        onNotice(notClaimed);
        await refreshReportingFailure();
        return;
      }
      onSuccess();
    } catch (error) {
      // Nothing was sent, so nothing can mine: the next Claim may send.
      if (!hash) writeOwnEntry(null);
      console.error(`Failed to claim staking incentives${hash ? ` (tx ${hash})` : ''}`, error);
      onNotice(toClaimError(error));
    } finally {
      if (mountedRef.current) setPhase('idle');
    }
  };

  // Never a `preparing` claim: its run is still going and will reach the wallet.
  const dismissable = pendingClaims.filter(
    (entry) =>
      entry.status === 'unconfirmed' ||
      (entry.status === 'sending' && !ownRuns.current.has(entry.run)),
  );
  const canDismissPendingClaim = dismissable.length > 0;

  /** For a hash the wallet replaced or dropped, or a wallet request that was never answered. */
  const dismissPendingClaim = () => {
    if (!account) return;
    dismissable.forEach(({ run }) => setPending(account, run, null));
  };

  const isPending = phase !== 'idle' || pendingClaims.length > 0;
  const claimButtonState: ClaimButtonState =
    phase === 'preparing' ? 'preparing' : isPending ? 'pending' : 'idle';

  return {
    claimIncentivesForBatch,
    dismissPendingClaim,
    claimButtonState,
    pendingHash,
    canDismissPendingClaim,
  };
};
