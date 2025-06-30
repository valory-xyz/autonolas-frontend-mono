import { getChainId, readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Address } from 'viem';
import type { Contract } from 'web3-eth-contract';

import { GENERIC_ERC20_CONTRACT_ABI, SERVICE_REGISTRY_L2_ABI } from 'common-util/AbiAndAddresses';
import { getAgentContract, getWeb3Details } from 'common-util/Contracts';
import { wagmiConfig } from 'common-util/Login/config';
import { GATEWAY_URL, HASH_PREFIX } from 'util/constants';

import { getIpfsResponse } from '.';

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

export const getMetadataHashByServiceId = async (serviceId: string, signal?: AbortSignal) => {
  try {
    const { address, chainId } = getWeb3Details();

    if (!address?.serviceRegistryL2) {
      throw new Error('Unsupported network, service registry address not found.');
    }

    const service = await readContract(wagmiConfig, {
      address: address.serviceRegistryL2,
      abi: SERVICE_REGISTRY_L2_ABI,
      functionName: 'getService',
      chainId,
      args: [BigInt(serviceId)],
    });

    // Retrieve code uri hash from the service
    const configHash = await getIpfsResponse(service.configHash);
    if (!configHash.code_uri) {
      console.error('No code uri found in config hash');
      return null;
    }

    // Try fetching service yaml
    const serviceYamlResponse = await fetch(
      `${configHash.code_uri.replace('ipfs://', GATEWAY_URL)}/mech/service.yaml`,
      { signal },
    );
    const serviceYamlText = await serviceYamlResponse.text();

    // Use a reg exp to find the metadata_hash
    const metadataHashMatch = serviceYamlText.match(
      /metadata_hash:\s*\${METADATA_HASH:str:([^\s}]+)/,
    );

    if (metadataHashMatch) {
      // Extract the matched metadata hash
      const metadataHash = metadataHashMatch[1];
      return metadataHash.replace(HASH_PREFIX, '0x');
    }
    return null;
  } catch (error) {
    console.error(`Unable to get hash for service: ${serviceId}`, error);
    return null;
  }
};
