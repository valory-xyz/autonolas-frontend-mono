import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

import { RPC_URLS } from 'libs/util-constants/src';

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID;

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet];

export const wagmiConfig = getDefaultConfig({
  appName: 'OLAS Build',
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
  chains: SUPPORTED_CHAINS,
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
  ssr: true,
});
