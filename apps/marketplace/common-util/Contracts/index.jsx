import { ethers } from 'ethers';

import { isL1Network } from 'libs/util-functions/src';

import { SERVICE_REGISTRY_CONTRACT, SERVICE_REGISTRY_L2 } from 'common-util/AbiAndAddresses';
import { getChainId, getProvider } from 'common-util/functions';

import { ADDRESSES } from './addresses';
import { RPC_URLS } from 'libs/util-constants/src';
import { TOKENOMICS } from 'libs/util-contracts/src/lib/abiAndAddresses';

/**
 * Returns the current wallet provider, chain id, and the address bag for the
 * connected chain. Used by callers that read the modal-injected provider
 * (e.g. for ethers-based RPCs that don't go through wagmi).
 */
export const getWeb3Details = () => {
  const chainId = getChainId();
  const address = ADDRESSES[chainId];
  return { chainId, address, provider: getProvider() };
};

/**
 * Fetches the service manager proxy address for the selected chain by calling
 * the manager function on the service registry contract.
 */
export const getServiceManagerAddress = async () => {
  try {
    const { chainId } = getWeb3Details();
    const rpcUrl = RPC_URLS[chainId];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractsAddresses = ADDRESSES[chainId];

    if (!contractsAddresses) {
      throw new Error(`No addresses found for chainId: ${chainId}`);
    }

    const registryAddress = isL1Network(chainId)
      ? contractsAddresses.serviceRegistry
      : contractsAddresses.serviceRegistryL2;
    const registryAbi = isL1Network(chainId)
      ? SERVICE_REGISTRY_CONTRACT.abi
      : SERVICE_REGISTRY_L2.abi;

    if (!registryAddress) {
      throw new Error(`No service registry address found for chainId: ${chainId}`);
    }

    const serviceRegistryContract = new ethers.Contract(registryAddress, registryAbi, provider);
    const serviceManagerAddress = await serviceRegistryContract.manager();
    return serviceManagerAddress;
  } catch (error) {
    console.error('Error fetching service manager token address:', error);
    throw error;
  }
};

/** Returns ethers provider for ethereum (used by tokenomics ethers contract). */
export const getEthersProviderForEthereum = () => {
  return new ethers.JsonRpcProvider(RPC_URLS[1]);
};

/**
 * TODO: Remove this function once migrated to hooks.
 * Returns the tokenomics ethers contract.
 */
export const getTokenomicsEthersContract = (address) => {
  const provider = getEthersProviderForEthereum();
  return new ethers.Contract(address, TOKENOMICS.abi, provider);
};
