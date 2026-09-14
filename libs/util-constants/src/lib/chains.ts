import { defineChain } from 'viem';
import { Chain, arbitrum, base, celo, gnosis, mainnet, mode, optimism, polygon } from 'viem/chains';

// Arbitrum Orbit rollup settling to Ethereum, ETH gas. Not in viem/chains yet.
export const robinhood = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
  blockExplorers: {
    default: { name: 'Robinhood Chain Explorer', url: 'https://robinhoodchain.blockscout.com' },
  },
  contracts: { multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' } },
});

export const CHAIN_NAMES: Record<string, string> = {
  1: mainnet.name,
  10: optimism.name,
  100: gnosis.name,
  137: polygon.name,
  4_663: robinhood.name,
  8_453: base.name,
  34_443: mode.name,
  42_161: arbitrum.name,
  42_220: celo.name,
};

export const CHAINS: Record<string, Chain> = {
  1: mainnet,
  10: optimism,
  100: gnosis,
  137: polygon,
  4_663: robinhood,
  8_453: base,
  34_443: mode,
  42_161: arbitrum,
  42_220: celo,
};

export const VM_TYPE = {
  EVM: 'EVM',
  SVM: 'SVM',
} as const;
