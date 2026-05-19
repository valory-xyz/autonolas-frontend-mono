import { simulateContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Address } from 'viem';
import { base } from 'wagmi/chains';

import { contributorsParams } from 'common-util/Contracts/params';
import { wagmiConfig } from 'components/Login/config';

type RestakeParams = {
  account: Address;
  contractAddress: Address;
};

export const restake = async ({ account, contractAddress }: RestakeParams) => {
  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...contributorsParams,
      functionName: 'reStake',
      args: [contractAddress],
      account,
    });
    const hash = await writeContract(wagmiConfig, request);
    return waitForTransactionReceipt(wagmiConfig, { chainId: base.id, hash });
  } catch (error) {
    console.error('Error restaking:', error);
    throw error;
  }
};
