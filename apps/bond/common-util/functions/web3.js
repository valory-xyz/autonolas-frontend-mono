import { createPublicClient, getContract as getViemContract, http } from 'viem';

import { CHAINS, RPC_URLS } from 'libs/util-constants/src';
import { UNISWAP_V2_PAIR_ABI } from 'libs/util-contracts/src/lib/abiAndAddresses';

/**
 * Returns a viem contract instance bound to a public client for the given chain.
 * Used for cross-chain LP price reads where the connected wallet's chain
 * doesn't match the LP's chain.
 */
export const getUniswapV2PairContractByChain = (address, chainId) => {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Chain not found for provided chainId: ${chainId}`);
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URLS[chainId] || chain.rpcUrls[0].http),
  });

  return getViemContract({
    address,
    abi: UNISWAP_V2_PAIR_ABI,
    client: publicClient,
  });
};
