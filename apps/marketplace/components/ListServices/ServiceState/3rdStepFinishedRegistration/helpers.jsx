import { getPublicClient } from '@wagmi/core';

import { GNOSIS_SAFE_CONTRACT } from 'common-util/AbiAndAddresses';
import { wagmiConfig } from 'common-util/Login/config';

/**
 * Poll the multisig Safe for the `ApproveHash` event matching the supplied
 * approvedHash + owner filter. Resolves once at least one event is seen on
 * chain, which is how we detect that the queued Safe-owner approval has been
 * confirmed before triggering the deploy step.
 *
 * Uses viem's public client `.getContractEvents` — `@wagmi/core` 2.6.17
 * doesn't export `getContractEvents` as a top-level action, only as a method
 * on the public client returned by `getPublicClient`.
 */
export const isHashApproved = ({ multisig, chainId, startingBlock, approvedHash, owner }) =>
  new Promise((resolve, reject) => {
    const publicClient = getPublicClient(wagmiConfig, { chainId });
    const fromBlock = BigInt(Math.max(0, Number(startingBlock) - 10));
    const interval = setInterval(async () => {
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
          clearInterval(interval);
          resolve();
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 5000);
  });
