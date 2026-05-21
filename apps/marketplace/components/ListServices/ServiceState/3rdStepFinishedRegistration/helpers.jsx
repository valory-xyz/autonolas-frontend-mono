import { getContractEvents } from '@wagmi/core';

import { gnosisSafeParams } from 'common-util/Contracts/params';
import { wagmiConfig } from 'common-util/Login/config';

/**
 * Poll the multisig Safe for the `ApproveHash` event matching the supplied
 * approvedHash + owner filter. Resolves once at least one event is seen on
 * chain, which is how we detect that the queued Safe-owner approval has been
 * confirmed before triggering the deploy step.
 */
export const isHashApproved = ({ multisig, chainId, startingBlock, approvedHash, owner }) =>
  new Promise((resolve, reject) => {
    const fromBlock = BigInt(Math.max(0, Number(startingBlock) - 10));
    const interval = setInterval(async () => {
      try {
        const events = await getContractEvents(wagmiConfig, {
          ...gnosisSafeParams(multisig, chainId),
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
