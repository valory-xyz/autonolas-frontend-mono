import Web3 from 'web3';
import { ethers } from 'ethers';
import {
  DEPOSITORY,
  DISPENSER,
  TREASURY,
  TOKENOMICS,
  AGENT_REGISTRY,
  COMPONENT_REGISTRY,
  SERVICE_REGISTRY,
  ERC20_ABI,
} from 'libs/util-contracts/src/lib/abiAndAddresses';

import { ADDRESSES } from 'common-util/constants/addresses';
import {
  getChainId,
  getProvider,
} from 'common-util/functions/frontend-library';
import { RPC_URLS } from 'common-util/constants/rpcs';

/**
 * returns the web3 details
 */
const getWeb3Details = () => {
  const chainId = getChainId();
  const web3 = new Web3(getProvider());
  return { web3, chainId };
};

/**
 * returns the contract instance
 * @param {Array} abi - abi of the contract
 * @param {String} contractAddress - address of the contract
 */
const getContract = (abi, contractAddress) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

export const getDepositoryContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(DEPOSITORY.abi, ADDRESSES[chainId].depository);
  return contract;
};

export const getDispenserContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(DISPENSER.abi, ADDRESSES[chainId].dispenser);
  return contract;
};

export const getTreasuryContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(TREASURY.abi, ADDRESSES[chainId].treasury);
  return contract;
};

export const getTokenomicsContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(TOKENOMICS.abi, ADDRESSES[chainId].tokenomics);
  return contract;
};

export const getErc20Contract = (address) => {
  const contract = getContract(ERC20_ABI, address);
  return contract;
};

export const getAgentContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(AGENT_REGISTRY.abi, ADDRESSES[chainId].agent);
  return contract;
};

export const getComponentContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    COMPONENT_REGISTRY.abi,
    ADDRESSES[chainId].component,
  );
  return contract;
};

export const getServiceContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    SERVICE_REGISTRY.abi,
    ADDRESSES[chainId].service,
  );
  return contract;
};


/**
 *
 * @returns ethers provider for ethereum
 */
export const getEthersProviderForEthereum = () => {
  const provider = new ethers.JsonRpcProvider(RPC_URLS[1]);
  return provider;
};

/**
 * TODO: Remove this function once migrated to hooks
 * @returns tokenomics ethers contract
 */
export const getTokenomicsEthersContract = (address) => {
  const provider = getEthersProviderForEthereum();
  const contract = new ethers.Contract(address, TOKENOMICS.abi, provider);
  return contract;
};
