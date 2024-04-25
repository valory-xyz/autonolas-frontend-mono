import {
  mainnet,
  goerli,
  optimism,
  gnosis,
  polygon,
  base,
  arbitrum,
} from 'wagmi/chains';

import { LOCAL_FORK_ID } from '@autonolas/frontend-library';

export const RPC_URLS = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL ?? mainnet.rpcUrls.default.http[0],
  5: process.env.NEXT_PUBLIC_GOERLI_URL ?? goerli.rpcUrls.default.http[0],
  10: process.env.NEXT_PUBLIC_OPTIMISM_URL ?? optimism.rpcUrls.default.http[0],
  100: process.env.NEXT_PUBLIC_GNOSIS_URL ?? gnosis.rpcUrls.default.http[0],
  137: process.env.NEXT_PUBLIC_POLYGON_URL ?? polygon.rpcUrls.default.http[0],
  8453: process.env.NEXT_PUBLIC_BASE_URL ?? base.rpcUrls.default.http[0],
  42161:
    process.env.NEXT_PUBLIC_ARBITRUM_URL ?? arbitrum.rpcUrls.default.http[0],
  [LOCAL_FORK_ID]: 'http://127.0.0.1:8545',
};
