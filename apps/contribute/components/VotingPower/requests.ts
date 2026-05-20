import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { Address } from 'viem';

import { delegateContributeParams, veolasParams } from 'common-util/Contracts/params';
import { wagmiConfig } from 'components/Login/config';

/** delegatorList - those who delegated veOlas to the provided account */
export const fetchDelegatorList = async ({ account }: { account: string }) => {
  return readContract(wagmiConfig, {
    ...delegateContributeParams,
    functionName: 'getDelegatorList',
    args: [account as Address],
  });
};

/** delegatee - who you delegated to */
export const fetchDelegatee = async ({ account }: { account: string }) => {
  return readContract(wagmiConfig, {
    ...delegateContributeParams,
    functionName: 'mapDelegation',
    args: [account as Address],
  });
};

/** Delegate Contribute voting power to an address. */
export const delegate = async ({ account, delegatee }: { account: string; delegatee: string }) => {
  const { request } = await simulateContract(wagmiConfig, {
    ...delegateContributeParams,
    functionName: 'delegate',
    args: [delegatee as Address],
    account: account as Address,
  });
  const hash = await writeContract(wagmiConfig, request);
  return waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: delegateContributeParams.chainId,
  });
};

export const fetchVeolasBalance = async ({ account }: { account: string }) => {
  return readContract(wagmiConfig, {
    ...veolasParams,
    functionName: 'getVotes',
    args: [account as Address],
  });
};
