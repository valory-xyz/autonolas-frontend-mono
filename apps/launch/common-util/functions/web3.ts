import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import { VE_OLAS, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getChainId, getProvider } from 'common-util/functions/frontend-library';

/**
 * returns the web3 details
 */
export const getWeb3Details = () => {
  const chainId = getChainId();
  const web3 = new Web3(getProvider());
  return { web3, chainId };
};

/**
 * returns the contract instance
 * @param {Array} abi - abi of the contract
 * @param {String} contractAddress - address of the contract
 */
const getContract = (abi: AbiItem[], contractAddress: string, chainId?: number) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

export const getVeOlasContract = () => {
  const { chainId } = getWeb3Details();
  const abi = VE_OLAS.abi as AbiItem[];
  const address = (VE_OLAS.addresses as Record<number, string>)[chainId as number];
  const contract = getContract(abi, address);
  return contract;
};

export const getVoteWeightingContract = () => {
  const { chainId } = getWeb3Details();
  const abi = VOTE_WEIGHTING.abi as AbiItem[];
  const address = (VOTE_WEIGHTING.addresses as Record<number, string>)[chainId as number];
  const contract = getContract(abi, address);
  return contract;
};
