import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import {
  Chain,
  arbitrum,
  base,
  celo,
  gnosis,
  hardhat,
  mainnet,
  optimism,
  polygon,
  mode,
} from 'wagmi/chains';

import { RPC_URLS } from 'libs/util-constants/src';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [
  mainnet,
  gnosis,
  polygon,
  mode,
  optimism,
  base,
  arbitrum,
  celo,
  ...(process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true' ? [hardhat] : []),
];

export const wagmiConfig = getDefaultConfig({
  appName: 'OLAS Launch',
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
  chains: SUPPORTED_CHAINS,
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
  ssr: true,
});
