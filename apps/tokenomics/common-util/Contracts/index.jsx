import Web3 from 'web3';
import { LOCAL_FORK_ID } from '@autonolas/frontend-library';

import { LOCAL_CHAIN_ID } from 'util/constants';
import { getChainId, getProvider } from 'common-util/functions';
import {
  DEPOSITORY,
  DISPENSER,
  TREASURY,
  TOKENOMICS,
  BOND_CALCULATOR,
  UNISWAP_V2_PAIR_ABI,
  AGENT_REGISTRY,
  COMPONENT_REGISTRY,
  SERVICE_REGISTRY,
  ERC20_ABI,
} from 'common-util/AbiAndAddresses';

const LOCAL_ADDRESSES = {
  dispenser: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
  depository: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
  treasury: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  tokenomics: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
  genericBondCalculator: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
  agent: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  component: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  service: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  olasAddress: 'TODO', // TODO: run docker and get this address
};

const MAINNET_ADDRESSES = {
  dispenser: DISPENSER.addresses[1],
  depository: DEPOSITORY.addresses[1],
  treasury: TREASURY.addresses[1],
  tokenomics: TOKENOMICS.addresses[1],
  genericBondCalculator: BOND_CALCULATOR.addresses[1],
  agent: AGENT_REGISTRY.addresses[1],
  component: COMPONENT_REGISTRY.addresses[1],
  service: SERVICE_REGISTRY.addresses[1],
  olasAddress: '0x0001A500A6B18995B03f44bb040A5fFc28E45CB0',
};

export const ADDRESSES = {
  1: MAINNET_ADDRESSES,
  5: {
    dispenser: DISPENSER.addresses[5],
    depository: DEPOSITORY.addresses[5],
    treasury: TREASURY.addresses[5],
    tokenomics: TOKENOMICS.addresses[5],
    genericBondCalculator: BOND_CALCULATOR.addresses[5],
    agent: AGENT_REGISTRY.addresses[5],
    component: COMPONENT_REGISTRY.addresses[5],
    service: SERVICE_REGISTRY.addresses[5],
    olasAddress: '0xEdfc28215B1Eb6eb0be426f1f529cf691A5C2400',
  },
  // NOTE: Except 1 & 5 other addresses are used for LP pairs
  100: {
    olasAddress: '0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },
  10200: {
    olasAddress: '0xE40AE73aa0Ed3Ec35fdAF56e01FCd0D1Ff1d9AB6',
  },
  [LOCAL_CHAIN_ID]: LOCAL_ADDRESSES,
  [LOCAL_FORK_ID]: MAINNET_ADDRESSES,
};

/**
 * returns the web3 details
 */
const getWeb3Details = () => {
  const web3 = new Web3(getProvider());
  const chainId = getChainId();
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

export const getUniswapV2PairContract = (address) => {
  const contract = getContract(UNISWAP_V2_PAIR_ABI, address);
  return contract;
};

export const getErc20Contract = (address) => {
  const contract = getContract(ERC20_ABI, address);
  return contract;
};

export const getGenericBondCalculatorContract = () => {
  const { chainId } = getWeb3Details();
  const contract = getContract(
    BOND_CALCULATOR.abi,
    ADDRESSES[chainId].genericBondCalculator,
  );
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

export const RPC_URLS = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL,
  5: process.env.NEXT_PUBLIC_GOERLI_URL,
  100: process.env.NEXT_PUBLIC_GNOSIS_URL,
  [LOCAL_FORK_ID]: 'http://127.0.0.1:8545',
};
