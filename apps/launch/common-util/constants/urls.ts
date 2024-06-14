import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon } from 'viem/chains';

export const GET_VEOLAS_URL = 'https://member.olas.network/';

export const EXPLORE_URLS: Record<string, string> = {
  1: mainnet.blockExplorers.default.url,
  10: optimism.blockExplorers.default.url,
  100: gnosis.blockExplorers.default.url,
  137: polygon.blockExplorers.default.url,
  8453: base.blockExplorers.default.url,
  42_161: arbitrum.blockExplorers.default.url,
  42_220: celo.blockExplorers.default.url,
};
