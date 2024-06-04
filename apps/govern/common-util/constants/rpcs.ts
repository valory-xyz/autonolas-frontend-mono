import { mainnet } from 'wagmi/chains';

import { STAGING_CHAIN_ID } from '@autonolas/frontend-library';

export const RPC_URLS: Record<number, string> = {
  1:
    (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET
      ? process.env.NEXT_PUBLIC_MAINNET_TEST_RPC
      : process.env.NEXT_PUBLIC_MAINNET_URL) ?? mainnet.rpcUrls.default.http[0],
  [STAGING_CHAIN_ID]: 'http://127.0.0.1:8545',
};
