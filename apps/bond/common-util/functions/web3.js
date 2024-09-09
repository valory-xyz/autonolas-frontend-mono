import { createPublicClient, getContract as getWagmiContract, http } from 'viem';
import Web3 from 'web3';

import { CHAINS, RPC_URLS } from 'libs/util-constants/src';
import {
  BOND_CALCULATOR,
  DEPOSITORY,
  ERC20_ABI,
  TOKENOMICS,
  UNISWAP_V2_PAIR_ABI,
} from 'libs/util-contracts/src/lib/abiAndAddresses';

import { ADDRESSES } from 'common-util/constants/addresses';
import { getChainId, getProvider } from 'common-util/functions/frontend-library';

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

export const getTokenomicsContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(TOKENOMICS.abi, ADDRESSES[chainId].tokenomics);
  return contract;
};

export const getUniswapV2PairContract = (address) => {
  const contract = getContract(UNISWAP_V2_PAIR_ABI, address);
  return contract;
};

export const getUniswapV2PairContractByChain = (address, chainId) => {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Chain not found for provided chainId: ${chainId}`);
  }

  const publicClient = createPublicClient({
    chain: chain,
    transport: http(RPC_URLS[chainId] || chain.rpcUrls[0].http),
  });

  const contract = getWagmiContract({
    address: address,
    abi: UNISWAP_V2_PAIR_ABI,
    client: publicClient,
  });

  return contract;
};

export const getErc20Contract = (address) => {
  const contract = getContract(ERC20_ABI, address);
  return contract;
};

export const getGenericBondCalculatorContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(BOND_CALCULATOR.abi, ADDRESSES[chainId].genericBondCalculator);
  return contract;
};
