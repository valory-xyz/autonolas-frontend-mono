import Web3 from 'web3';
import { RPC_URLS } from 'common-util/Contracts';
import {
  getProvider as getProviderFn,
  getChainId as getChainIdFn,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  sendTransaction as sendTransactionFn,
} from '@autonolas/frontend-library';
import { SUPPORTED_CHAINS } from 'common-util/Login';
import {
  DISPENSER,
  TREASURY,
  TOKENOMICS,
  AGENT_REGISTRY,
  COMPONENT_REGISTRY,
} from 'common-util/abiAndAddresses';

export const getProvider = () => getProviderFn(SUPPORTED_CHAINS, RPC_URLS);

export const getIsValidChainId = (chainId) => getIsValidChainIdFn(SUPPORTED_CHAINS, chainId);

export const getChainIdOrDefaultToMainnet = (chainId) => {
  const x = getChainIdOrDefaultToMainnetFn(SUPPORTED_CHAINS, chainId);
  return x;
};

export const getChainId = (chainId = null) => getChainIdFn(SUPPORTED_CHAINS, chainId);

export const sendTransaction = (fn, account) => sendTransactionFn(fn, account, {
  supportedChains: SUPPORTED_CHAINS,
  rpcUrls: RPC_URLS,
});

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

export const getDispenserContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(DISPENSER.abi, DISPENSER.addresses[chainId]);
  return contract;
};

export const getTreasuryContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(TREASURY.abi, TREASURY.addresses[chainId]);
  return contract;
};

export const getTokenomicsContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(TOKENOMICS.abi, TOKENOMICS.addresses[chainId]);
  return contract;
};

export const getAgentContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    AGENT_REGISTRY.abi,
    AGENT_REGISTRY.addresses[chainId],
  );
  return contract;
};

export const getComponentContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    COMPONENT_REGISTRY.abi,
    COMPONENT_REGISTRY.addresses[chainId],
  );
  return contract;
};

/**
 * TODO: move to autonolas-library and figure out a better way
 * to fetch timestamp
 */
export const getBlockTimestamp = async (block = 'latest') => {
  const { web3 } = getWeb3Details();
  const temp = await web3.eth.getBlock(block);
  return temp.timestamp * 1;
};
