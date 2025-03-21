import { getChainId, readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Address } from 'viem';
import { Contract } from 'web3-eth-contract';

import { GENERIC_ERC20_CONTRACT_ABI } from 'common-util/AbiAndAddresses';
import { getAgentContract } from 'common-util/Contracts';
import { wagmiConfig } from 'common-util/Login/config';

/**
 * @returns either agent's ID (for legacy mechs) or service Id
 */
export const getTokenId = (contract: Contract) =>
  new Promise<string>((resolve, reject) => {
    contract.methods
      .tokenId()
      .call()
      .then((response: string) => {
        resolve(response);
      })
      .catch((e: typeof Error) => {
        console.error(e);
        reject(e);
      });
  });

export const getAgentHashes = (id: string) =>
  new Promise<{ agentHashes: string[] }>((resolve, reject) => {
    const contract = getAgentContract();

    contract.methods
      .getHashes(id)
      .call()
      .then((response: { agentHashes: string[] }) => {
        resolve(response);
      })
      .catch((e: typeof Error) => {
        console.error(e);
        reject(e);
      });
  });

type CheckAndApproveArgs = {
  account: Address;
  token: Address;
  addressToApprove: Address;
  amountToApprove: bigint;
};

const hasSufficientTokenRequest = async ({
  account,
  token,
  amountToApprove,
  addressToApprove,
}: CheckAndApproveArgs) => {
  try {
    const balance = await readContract(wagmiConfig, {
      address: token,
      abi: GENERIC_ERC20_CONTRACT_ABI,
      functionName: 'balanceOf',
      args: [account],
    });

    if (balance < amountToApprove) {
      throw new Error('Insufficient balance');
    }

    const allowance = await readContract(wagmiConfig, {
      address: token,
      abi: GENERIC_ERC20_CONTRACT_ABI,
      functionName: 'allowance',
      args: [account, addressToApprove],
    });
    return allowance >= amountToApprove;
  } catch (error) {
    console.error(error);
    throw new Error('Error checking allowance');
  }
};

const approveToken = async ({
  token,
  amountToApprove,
  addressToApprove,
}: Omit<CheckAndApproveArgs, 'account'>) => {
  try {
    const hash = await writeContract(wagmiConfig, {
      address: token,
      abi: GENERIC_ERC20_CONTRACT_ABI,
      functionName: 'approve',
      args: [addressToApprove, amountToApprove],
    });

    // Wait for the transaction receipt
    const chainId = getChainId(wagmiConfig);
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      chainId,
      hash,
    });

    return receipt;
  } catch (error) {
    console.error(error);
    throw new Error('Error approving tokens');
  }
};

export const checkAndApproveToken = async ({
  account,
  token,
  amountToApprove,
  addressToApprove,
}: CheckAndApproveArgs) => {
  const hasTokenBalance = await hasSufficientTokenRequest({
    account,
    token,
    addressToApprove,
    amountToApprove,
  });

  if (hasTokenBalance) return null;

  const response = await approveToken({
    token,
    addressToApprove,
    amountToApprove,
  });

  return response;
};
