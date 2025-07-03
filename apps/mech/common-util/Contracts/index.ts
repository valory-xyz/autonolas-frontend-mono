import { Abi, Address } from 'viem';
import { base, gnosis } from 'wagmi/chains';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import {
  AGENT_MECH_ABI,
  AGENT_REGISTRY_ABI,
  AGENT_REGISTRY_ADDRESSES,
  MECH_MARKETPLACE_ABI,
  MECH_MARKETPLACE_ADDRESSES,
  OLAS_MECH_ABI,
  SERVICE_REGISTRY_L2_ABI,
  SERVICE_REGISTRY_L2_ADDRESSES,
} from 'common-util/AbiAndAddresses';
import { getChainId, getProvider } from 'common-util/functions';
import { Network } from 'types/index';

export const ADDRESSES: Record<
  Network,
  {
    agentRegistry: Address;
    mechMarketplace: Address;
    serviceRegistryL2: Address;
  }
> = {
  [gnosis.id]: {
    agentRegistry: AGENT_REGISTRY_ADDRESSES[gnosis.id],
    mechMarketplace: MECH_MARKETPLACE_ADDRESSES[gnosis.id],
    serviceRegistryL2: SERVICE_REGISTRY_L2_ADDRESSES[gnosis.id],
  },
  [base.id]: {
    agentRegistry: AGENT_REGISTRY_ADDRESSES[base.id],
    mechMarketplace: MECH_MARKETPLACE_ADDRESSES[base.id],
    serviceRegistryL2: SERVICE_REGISTRY_L2_ADDRESSES[base.id],
  },
};

export const getWeb3Details = () => {
  const web3 = new Web3(getProvider());
  const chainId = getChainId();
  const address = chainId ? ADDRESSES[chainId] : null;

  return { web3, address, chainId };
};

export const getContract = <T extends Abi>(abi: T, contractAddress: string) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi as unknown as AbiItem[], contractAddress);
  return contract;
};

export const getAgentContract = () => {
  const agentRegistryAddress = getWeb3Details().address?.agentRegistry;
  if (!agentRegistryAddress) {
    throw new Error('Unsupported network, agent registry address not found.');
  }

  const contract = getContract(AGENT_REGISTRY_ABI, agentRegistryAddress);
  return contract;
};

export const getServiceContract = () => {
  const serviceRegistryL2Address = getWeb3Details().address?.serviceRegistryL2;
  if (!serviceRegistryL2Address) {
    throw new Error('Unsupported network, service registry address not found.');
  }

  const contract = getContract(SERVICE_REGISTRY_L2_ABI, serviceRegistryL2Address);
  return contract;
};

export const getMarketplaceContract = () => {
  const mechMarketplaceAddress = getWeb3Details().address?.mechMarketplace;
  if (!mechMarketplaceAddress) {
    throw new Error('Unsupported network, marketplace contract address not found.');
  }

  const contract = getContract(MECH_MARKETPLACE_ABI, mechMarketplaceAddress);
  return contract;
};

export const getLegacyMechContract = (mechAddress: string) => {
  const contract = getContract(AGENT_MECH_ABI, mechAddress);
  return contract;
};

export const getMechContract = (mechAddress: string) => {
  const contract = getContract(OLAS_MECH_ABI, mechAddress);
  return contract;
};
