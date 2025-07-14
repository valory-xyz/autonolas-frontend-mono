import { Abi } from 'viem';
import { base, goerli, mainnet } from 'viem/chains';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import {
  CONTRIBUTORS_V2_ABI, // Contributors
  CONTRIBUTORS_V2_ADDRESS_BASE,
  DELEGATE_CONTRIBUTE_ABI, // delegateContribute
  DELEGATE_CONTRIBUTE_ADDRESS_MAINNET,
  MINT_NFT_CONTRACT_ABI_GOERLI,
  MINT_NFT_CONTRACT_ABI_MAINNET,
  MINT_NFT_CONTRACT_ADDRESS_GOERLI,
  MINT_NFT_CONTRACT_ADDRESS_MAINNET,
  SERVICE_REGISTRY_L2_ABI,
  SERVICE_REGISTRY_L2_ADDRESS_BASE,
  VEOLAS_ABI, // veOlas
  VEOLAS_ADDRESS_GOERLI,
  VEOLAS_ADDRESS_MAINNET,
} from 'common-util/AbiAndAddresses';
import { getChainId, getProvider } from 'common-util/functions';

type AddressInfo = {
  mintNft: string;
  veOlas: string;
};

type AddressRecord = Record<number, AddressInfo>;

const ADDRESSES: AddressRecord = {
  1: {
    mintNft: MINT_NFT_CONTRACT_ADDRESS_MAINNET,
    veOlas: VEOLAS_ADDRESS_MAINNET,
  },
  5: {
    mintNft: MINT_NFT_CONTRACT_ADDRESS_GOERLI,
    veOlas: VEOLAS_ADDRESS_GOERLI,
  },
};

const getWeb3Details = (): {
  web3: Web3;
  address: AddressInfo | undefined;
  chainId: number | undefined;
} => {
  const web3 = new Web3(getProvider());
  const chainId = getChainId();

  if (chainId === undefined) {
    throw new Error('ChainId undefined.');
  }

  const address = ADDRESSES[chainId];

  return { web3, address, chainId };
};

/**
 * returns the contract instance
 * @param {Array} abi - abi of the contract
 * @param {String} contractAddress - address of the contract
 */
const getContract = <T extends Abi>(abi: T, contractAddress: string) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi as unknown as AbiItem | AbiItem[], contractAddress);
  return contract;
};

export const getMintContract = () => {
  const { chainId } = getWeb3Details();

  if (chainId === undefined) {
    return null;
  }

  if (!ADDRESSES[chainId]) {
    return null;
  }

  const contract = getContract(
    chainId === 5 ? MINT_NFT_CONTRACT_ABI_GOERLI : MINT_NFT_CONTRACT_ABI_MAINNET,
    ADDRESSES[chainId].mintNft,
  );

  return contract;
};

export const getVeolasContract = () => {
  const contract = getContract(VEOLAS_ABI, VEOLAS_ADDRESS_MAINNET);
  return contract;
};

export const getDelegateContributeContract = () => {
  const contract = getContract(DELEGATE_CONTRIBUTE_ABI, DELEGATE_CONTRIBUTE_ADDRESS_MAINNET);
  return contract;
};

export const getContributorsContract = () => {
  const contract = getContract(CONTRIBUTORS_V2_ABI, CONTRIBUTORS_V2_ADDRESS_BASE);
  return contract;
};

export const getServiceRegistryL2Contract = () => {
  const contract = getContract(SERVICE_REGISTRY_L2_ABI, SERVICE_REGISTRY_L2_ADDRESS_BASE);
  return contract;
};

export const RPC_URLS: { [key: number]: string | undefined } = {
  [mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_URL,
  [goerli.id]: process.env.NEXT_PUBLIC_GOERLI_URL,
  [base.id]: process.env.NEXT_PUBLIC_BASE_URL,
};
