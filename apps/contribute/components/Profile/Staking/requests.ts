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
    const callParams = {
      ...contributorsParams,
      functionName: 'reStake' as const,
      args: [contractAddress],
      account,
    };
    const { request } = await simulateContract(wagmiConfig, callParams);
    const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
    const hash = await writeContract(wagmiConfig, { ...request, gas });
    return waitForTransactionReceipt(wagmiConfig, { chainId: base.id, hash });
  } catch (error) {
    console.error('Error restaking:', error);
    throw error;
  }
};
