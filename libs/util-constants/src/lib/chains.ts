import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon } from 'viem/chains';

export const CHAIN_NAMES: Record<string, string> = {
  1: mainnet.name,
  10: optimism.name,
  100: gnosis.name,
  137: polygon.name,
  8453: base.name,
  42_161: arbitrum.name,
  42_220: celo.name,
};
