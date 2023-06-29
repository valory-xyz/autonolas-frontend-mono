import Web3 from 'web3';
import {
  // depository
  DEPOSITORY_ADDRESS_GOERLI,
  DEPOSITORY_ADDRESS_MAINNET,
  DEPOSITORY_ABI,

  // dispensers
  DISPENSER_ADDRESS_GOERLI,
  DISPENSER_ADDRESS_MAINNET,
  DISPENSER_ABI,

  // treasury
  TREASURY_ADDRESS_GOERLI,
  TREASURY_ADDRESS_MAINNET,
  TREASURY_ABI,

  // tokenomics
  TOKENOMICS_PROXY_ADDRESS_GOERLI,
  TOKENOMICS_PROXY_ADDRESS_MAINNET,
  TOKENOMICS_ABI,

  // uniswap
  UNISWAP_V2_PAIR_ABI,
} from 'common-util/AbiAndAddresses';
import { LOCAL_CHAIN_ID } from 'util/constants';

/**
 * Addresses fetched when backend connected locally
 * (initDeploy.json in backend repository)
 */
export const LOCAL_ADDRESSES = {
  DEPOSITORY_ADDRESS_LOCAL: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
  DISPENSER_ADDRESS_LOCAL: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
  TREASURY_ADDRESS_LOCAL: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  TOKENOMICS_PROXY_ADDRESS_LOCAL: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
};

/**
 * Returns contract address based on type and chainId.
 */
export const getContractAddress = (type, chainId) => {
  switch (type) {
    case 'dispenser': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.DISPENSER_ADDRESS_LOCAL;
      }
      if (chainId === 5) return DISPENSER_ADDRESS_GOERLI;
      return DISPENSER_ADDRESS_MAINNET;
    }

    case 'depository': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.DEPOSITORY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return DEPOSITORY_ADDRESS_GOERLI;
      return DEPOSITORY_ADDRESS_MAINNET;
    }

    case 'treasury': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.TREASURY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return TREASURY_ADDRESS_GOERLI;
      return TREASURY_ADDRESS_MAINNET;
    }

    case 'tokenomics': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.TOKENOMICS_PROXY_ADDRESS_LOCAL;
      }
      if (chainId === 5) return TOKENOMICS_PROXY_ADDRESS_GOERLI;
      return TOKENOMICS_PROXY_ADDRESS_MAINNET;
    }

    default:
      throw new Error('Invalid contract type');
  }
};

export const getDepositoryContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    DEPOSITORY_ABI,
    getContractAddress('depository', chainId),
  );
  return contract;
};

export const getDispenserContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    DISPENSER_ABI,
    getContractAddress('dispenser', chainId),
  );
  return contract;
};

export const getTreasuryContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    TREASURY_ABI,
    getContractAddress('treasury', chainId),
  );
  return contract;
};

export const getTokenomicsContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    TOKENOMICS_ABI,
    getContractAddress('tokenomics', chainId),
  );
  return contract;
};

export const getUniswapV2PairContract = (p, address) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(UNISWAP_V2_PAIR_ABI, address);
  return contract;
};

export const rpc = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL,
  5: process.env.NEXT_PUBLIC_GOERLI_URL,
};
