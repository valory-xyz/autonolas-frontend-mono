import { getPublicClient } from '@wagmi/core';

import { GNOSIS_SAFE_CONTRACT } from 'common-util/AbiAndAddresses';
import { wagmiConfig } from 'common-util/Login/config';

const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_MS = 5 * 60 * 1_000;

/**
 * Poll the multisig Safe for the `ApproveHash` event matching the supplied
 * approvedHash + owner filter. Resolves once at least one event is seen on
 * chain, which is how we detect that the queued Safe-owner approval has been
 * confirmed before triggering the deploy step.
 *
 * Rejects after MAX_POLL_MS so the parent flow can surface a retry prompt
 * instead of hanging forever if the chain stalls or the event is dropped.
 * The optional `signal` lets callers abort polling (e.g. on component unmount)
 * without leaking the setInterval.
 *
 * Uses viem's public client `.getContractEvents` — `@wagmi/core` 2.6.17
 * doesn't export `getContractEvents` as a top-level action, only as a method
 * on the public client returned by `getPublicClient`.
 */
export const isHashApproved = ({ multisig, chainId, startingBlock, approvedHash, owner, signal }) =>
  new Promise((resolve, reject) => {
    const publicClient = getPublicClient(wagmiConfig, { chainId });
    const fromBlock = BigInt(Math.max(0, Number(startingBlock) - 10));

    let interval;
    let timeout;
    let abortHandler;

    const cleanup = () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
      if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
    };

    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    if (signal) {
      abortHandler = () => {
        cleanup();
        reject(new Error('Aborted'));
      };
      signal.addEventListener('abort', abortHandler);
    }

    timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for ApproveHash event'));
    }, MAX_POLL_MS);

    interval = setInterval(async () => {
      try {
        const events = await publicClient.getContractEvents({
          address: multisig,
          abi: GNOSIS_SAFE_CONTRACT.abi,
          eventName: 'ApproveHash',
          args: { approvedHash, owner },
          fromBlock,
          toBlock: 'latest',
        });
        if (events.length > 0) {
          cleanup();
          resolve();
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    }, POLL_INTERVAL_MS);
  });
