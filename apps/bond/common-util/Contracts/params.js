import {
  DEPOSITORY,
  ERC20_ABI,
  TOKENOMICS,
  UNISWAP_V2_PAIR_ABI,
} from 'libs/util-contracts/src/lib/abiAndAddresses';

import { ADDRESSES } from 'common-util/constants/addresses';

// chainId is widened to `number` so wagmi's simulate/write/wait overloads
// accept it against the workspace's non-const chains tuple.

export const depositoryParams = (chainId) => ({
  address: ADDRESSES[chainId].depository,
  abi: DEPOSITORY.abi,
  chainId: Number(chainId),
});

export const tokenomicsParams = (chainId) => ({
  address: ADDRESSES[chainId].tokenomics,
  abi: TOKENOMICS.abi,
  chainId: Number(chainId),
});

export const uniswapV2PairParams = (address, chainId) => ({
  address,
  abi: UNISWAP_V2_PAIR_ABI,
  chainId: Number(chainId),
});

export const erc20Params = (address, chainId) => ({
  address,
  abi: ERC20_ABI,
  chainId: Number(chainId),
});
