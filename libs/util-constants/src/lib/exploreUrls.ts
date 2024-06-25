import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon } from 'viem/chains';

export const EXPLORER_URLS = {
  [mainnet.id]: mainnet.blockExplorers.default.url,
  [optimism.id]: optimism.blockExplorers.default.url,
  [gnosis.id]: gnosis.blockExplorers.default.url,
  [polygon.id]: polygon.blockExplorers.default.url,
  [base.id]: base.blockExplorers.default.url,
  [arbitrum.id]: arbitrum.blockExplorers.default.url,
  [celo.id]: celo.blockExplorers.default.url,
};
