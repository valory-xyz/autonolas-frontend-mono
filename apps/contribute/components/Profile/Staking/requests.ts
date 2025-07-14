import { waitForTransactionReceipt } from '@wagmi/core';
import { Address } from 'viem';
import { base } from 'wagmi/chains';

import { getContributorsContract } from 'common-util/Contracts';
import { wagmiConfig } from 'common-util/Login/config';
import { getEstimatedGasLimit } from 'common-util/functions/requests';

type RestakeParams = {
  account: Address;
  contractAddress: Address;
};

export const restake = async ({ account, contractAddress }: RestakeParams) => {
  try {
    const contract = getContributorsContract();
    const restakeFn = contract.methods.reStake(contractAddress);
    const estimatedGas = await getEstimatedGasLimit(restakeFn, account);
    const result = await restakeFn.send({ from: account, gas: estimatedGas });
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      chainId: base.id,
      hash: result.transactionHash,
    });
    return receipt;
  } catch (error) {
    console.error('Error restaking:', error);
    throw error;
  }
};
