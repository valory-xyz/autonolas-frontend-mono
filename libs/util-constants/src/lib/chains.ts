import { Chain, arbitrum, base, celo, gnosis, mainnet, mode, optimism, polygon } from 'viem/chains';

export const CHAIN_NAMES: Record<string, string> = {
  1: mainnet.name,
  10: optimism.name,
  100: gnosis.name,
  137: polygon.name,
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
  8_453: base,
  34_443: mode,
  42_161: arbitrum,
  42_220: celo,
};
