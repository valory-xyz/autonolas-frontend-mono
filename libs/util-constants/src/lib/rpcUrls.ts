import { gnosis, mainnet, polygon } from 'wagmi/chains';

import { STAGING_CHAIN_ID } from '@autonolas/frontend-library';

export const RPC_URLS = {
  1:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true'
      ? process.env.NEXT_PUBLIC_MAINNET_TEST_RPC
      : process.env.NEXT_PUBLIC_MAINNET_URL) ?? mainnet.rpcUrls.default.http[0],
  100:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true'
      ? process.env.NEXT_PUBLIC_GNOSIS_TEST_RPC
      : process.env.NEXT_PUBLIC_GNOSIS_URL) ?? gnosis.rpcUrls.default.http[0],
  137:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true'
      ? process.env.NEXT_PUBLIC_POLYGON_TEST_RPC
      : process.env.NEXT_PUBLIC_POLYGON_URL) ?? polygon.rpcUrls.default.http[0],
  [STAGING_CHAIN_ID]: 'http://127.0.0.1:8545',
};

export type RpcUrl = keyof typeof RPC_URLS;
