import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon, mode } from 'wagmi/chains';

export const RPC_URLS: Record<number, string> = {
  1:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true'
      ? process.env.NEXT_PUBLIC_MAINNET_TEST_RPC
      : process.env.NEXT_PUBLIC_MAINNET_URL) ?? mainnet.rpcUrls.default.http[0],

  10: process.env.NEXT_PUBLIC_OPTIMISM_URL ?? optimism.rpcUrls.default.http[0],
  100:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true'
      ? process.env.NEXT_PUBLIC_GNOSIS_TEST_RPC
      : process.env.NEXT_PUBLIC_GNOSIS_URL) ?? gnosis.rpcUrls.default.http[0],
  137:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true'
      ? process.env.NEXT_PUBLIC_POLYGON_TEST_RPC
      : process.env.NEXT_PUBLIC_POLYGON_URL) ?? polygon.rpcUrls.default.http[0],
  8453: process.env.NEXT_PUBLIC_BASE_URL ?? base.rpcUrls.default.http[0],
  34443:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true'
      ? process.env.NEXT_PUBLIC_MODE_TEST_RPC
      : process.env.NEXT_PUBLIC_MODE_URL) ?? mode.rpcUrls.default.http[0],
  42161: process.env.NEXT_PUBLIC_ARBITRUM_URL ?? arbitrum.rpcUrls.default.http[0],
  42220: process.env.NEXT_PUBLIC_CELO_URL ?? celo.rpcUrls.default.http[0],
};

export type RpcUrl = keyof typeof RPC_URLS;
