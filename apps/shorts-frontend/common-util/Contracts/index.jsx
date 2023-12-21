import Web3 from 'web3';
import {
  AGENT_FACTORY_ABI,
  AGENT_MECH_ABI,
  AGENT_REGISTRY_ADDRESS_GNOSIS,
  AGENT_FACTORY_ADDRESS_GNOSIS,
  AGENT_MECH_ADDRESS_GNOSIS,
  AGENT_MULTISIG_ADDRESS_GNOSIS,
  AGENT_REGISTRY_ADDRESS_NEON,
  AGENT_FACTORY_ADDRESS_NEON,
  AGENT_MECH_ADDRESS_NEON,
  AGENT_MULTISIG_ADDRESS_NEON,
  AGENT_REGISTRY_ADDRESS_ZKEVM_POLYGON,
  AGENT_FACTORY_ADDRESS_ZKEVM_POLYGON,
  AGENT_MECH_ADDRESS_ZKEVM_POLYGON,
  AGENT_MULTISIG_ADDRESS_ZKEVM_POLYGON,
  BLOCKCHAIN_SHORTS_ADDRESS_GNOSIS,
  BLOCKCHAIN_SHORTS_ADDRESS_NEON,
  BLOCKCHAIN_SHORTS_ADDRESS_ZKEVM_POLYGON,
} from 'common-util/AbiAndAddresses';
import { getChainId, getProvider } from 'common-util/functions';

export const RPC_URLS = {
  100: process.env.NEXT_PUBLIC_GNOSIS_URL,
  245_022_934: process.env.NEXT_PUBLIC_NEON_URL,
  1_101: process.env.NEXT_PUBLIC_ZKEVM_POLYGON_URL,
};

export const SCAN_URLS = {
  100: 'https://gnosisscan.io/',
  245_022_934: 'https://neonscan.org/',
  1_101: 'https://zkevm.polygonscan.com/',
};

export const AGENT_URLS = {
  100: process.env.NEXT_PUBLIC_AGENT_GNOSIS_URL,
  245_022_934: process.env.NEXT_PUBLIC_AGENT_NEON_URL,
  1_101: process.env.NEXT_PUBLIC_AGENT_ZKEVM_POLYGON_URL,
};

export const ADDRESSES = {
  100: {
    agentRegistry: AGENT_REGISTRY_ADDRESS_GNOSIS,
    agentFactory: AGENT_FACTORY_ADDRESS_GNOSIS,
    defaultMech: AGENT_MECH_ADDRESS_GNOSIS,
    agentMultisig: AGENT_MULTISIG_ADDRESS_GNOSIS,
    blockchainShorts: BLOCKCHAIN_SHORTS_ADDRESS_GNOSIS,
  },
  245_022_934: {
    agentRegistry: AGENT_REGISTRY_ADDRESS_NEON,
    agentFactory: AGENT_FACTORY_ADDRESS_NEON,
    defaultMech: AGENT_MECH_ADDRESS_NEON,
    agentMultisig: AGENT_MULTISIG_ADDRESS_NEON,
    blockchainShorts: BLOCKCHAIN_SHORTS_ADDRESS_NEON,
  },
  1_101: {
    agentRegistry: AGENT_REGISTRY_ADDRESS_ZKEVM_POLYGON,
    agentFactory: AGENT_FACTORY_ADDRESS_ZKEVM_POLYGON,
    defaultMech: AGENT_MECH_ADDRESS_ZKEVM_POLYGON,
    agentMultisig: AGENT_MULTISIG_ADDRESS_ZKEVM_POLYGON,
    blockchainShorts: BLOCKCHAIN_SHORTS_ADDRESS_ZKEVM_POLYGON,
  },
};

const getWeb3Details = () => {
  const web3 = new Web3(getProvider());
  const chainId = getChainId();
  const address = ADDRESSES[chainId];
  return { web3, address, chainId };
};

export const getBlockchainShortsAddress = (id) => {
  const { chainId } = getWeb3Details();
  const url = SCAN_URLS[chainId];
  const address = ADDRESSES[chainId].blockchainShorts;
  return `${url}token/${address}`;
};

const getContract = (abi, contractAddress, web3) => {
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

export const getAgentURL = (defaultChainId = null) => {
  const { chainId } = defaultChainId
    ? { chainId: defaultChainId }
    : getWeb3Details();
  return AGENT_URLS[chainId];
};

export const getAgentMultisig = () => {
  const { address } = getWeb3Details();
  return address.agentMultisig;
};

export const getMechMinterContract = () => {
  const { web3, address } = getWeb3Details();
  const contract = getContract(AGENT_FACTORY_ABI, address.agentFactory, web3);
  return contract;
};

export const getMechContract = () => {
  const { web3, address } = getWeb3Details();
  const contract = getContract(AGENT_MECH_ABI, address.defaultMech, web3);
  return contract;
};
