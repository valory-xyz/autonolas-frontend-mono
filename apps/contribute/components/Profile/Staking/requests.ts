import { simulateContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Address } from 'viem';
import { base } from 'wagmi/chains';

import { estimateGasWithBuffer } from 'libs/util-functions/src/lib/estimateGasWithBuffer';

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
    const gas = await estimateGasWithBuffer(wagmiConfig, {
      ...contributorsParams,
      functionName: 'reStake',
      args: [contractAddress],
      account,
    });
    const hash = await writeContract(wagmiConfig, { ...request, gas });
    return waitForTransactionReceipt(wagmiConfig, { chainId: base.id, hash });
  } catch (error) {
    console.error('Error restaking:', error);
    throw error;
  }
};
