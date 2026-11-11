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

import { estimateGasWithBuffer } from 'libs/util-functions/src/lib/estimateGasWithBuffer';

import { type PendingClaim, setPendingClaim } from 'store/govern';
import { type RootState, useAppDispatch, useAppSelector } from 'store/index';
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
/** How often an unconfirmed claim's receipt is looked up again while the modal is open. */
export const PENDING_RECEIPT_POLL_MS = 15 * 1000;

export const stillPendingMessage = (hash: Hex) =>
  `Transaction ${hash} is still pending. Check your wallet before claiming again.`;

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onError: (error: ClaimError) => void;
  /** A claim whose wait ended without a receipt got one later. */
  onLateReceipt: (outcome: { hash: Hex; claimed: boolean }) => void;
  /** Re-reads the claim cursors and resolves to the rebuilt batches. */
  refetchClaimableBatches: () => Promise<ClaimableBatchesRefresh>;
  /** The batches were rebuilt, so the caller restarts from the first one. */
  onBatchesRebuilt: () => void;
  recordClaimedBatch: (batch: ClaimBatch) => void;
};

/** The receipt's outcome: `null` when it claimed, else why it did not. */
const getUnclaimedReason = (
  receipt: TransactionReceipt,
  replacedReason?: ReplacementReason,
): ClaimError | null => {
  if (replacedReason === 'cancelled') return { kind: 'wallet-rejected' };
  if (replacedReason === 'replaced' || receipt.status === 'reverted') {
    return { kind: 'reverted-after-simulation' };
  }
  return null;
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
    if (refresh.cursorsChanged) latestProps.current.onBatchesRebuilt();
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
          ? { kind: 'other', message: `Could not refresh the claim list: ${claimError.message}` }
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
    const checkReceipt = async () => {
      let receipt: TransactionReceipt;
      try {
        receipt = await publicClient.getTransactionReceipt({ hash: unconfirmedHash });
      } catch (error) {
        if (!(error instanceof TransactionReceiptNotFoundError)) {
          console.error(`Could not check claim transaction ${unconfirmedHash}`, error);
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
        const refreshed = await refreshBatches();
        if (!refreshed.cursorsChanged) throw retryError;
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
        kind: 'other',
        message:
          'hash' in inFlight
            ? stillPendingMessage(inFlight.hash)
            : 'A claim is already being prepared. Finish it in your wallet first.',
      });
      return;
    }
    setPending(account, { status: 'sending' });

    let hash: Hex | undefined;
    try {
      if (mountedRef.current) setIsPreparing(true);
      const prepared = await prepareWithOneRebuild(batch, account).finally(() => {
        if (mountedRef.current) setIsPreparing(false);
      });
      if ('kind' in prepared) {
        setPending(account, null);
        onError(prepared);
        return;
      }

      // viem's receipt action, not wagmi's: wagmi throws on a reverted receipt instead of returning it.
      const publicClient = getPublicClient(wagmiConfig, { chainId: MAINNET_CHAIN_ID });
      if (!publicClient) throw new Error('No Ethereum mainnet client is configured');

      if (mountedRef.current) setIsSending(true);
      const gas = await estimateGasWithBuffer(wagmiConfig, prepared.params);
      hash = await writeContract(wagmiConfig, { ...prepared.request, gas });
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
          kind: 'other',
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
      recordClaimedBatch([
        prepared.quotes.map(({ chainId }) => chainId),
        prepared.quotes.map(({ targets }) => targets),
      ]);
      onSuccess();
    } catch (error) {
      // Nothing was sent, so nothing can mine: the next Claim may send.
      if (!hash) setPending(account, null);
      console.error(`Failed to claim staking incentives${hash ? ` (tx ${hash})` : ''}`, error);
      onError(toClaimError(error));
    } finally {
      if (mountedRef.current) {
        setIsPreparing(false);
        setIsSending(false);
      }
    }
  };

  /** For a hash the wallet replaced or dropped, which will never get a receipt. */
  const dismissPendingClaim = () => {
    if (account && unconfirmedHash) setPending(account, null);
  };

  return {
    claimIncentivesForBatch,
    dismissPendingClaim,
    isPending: isPreparing || isSending || pending !== undefined,
    isPreparing,
    pendingHash,
    isPendingUnconfirmed: unconfirmedHash !== undefined,
  };
};
