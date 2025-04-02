import { cookieStorage, createStorage, http } from 'wagmi';
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
import { defaultWagmiConfig } from '@web3modal/wagmi';

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

const SUPPORTED_CHAINS_WITH_RPCS = SUPPORTED_CHAINS.map((chain) => {
  const defaultRpc = RPC_URLS[chain.id] || chain.rpcUrls.default.http[0];
  return {
    ...chain,
    rpcUrls: {
      ...chain.rpcUrls,
      default: { http: [defaultRpc] },
    },
  } as Chain;
});

const walletConnectMetadata = {
  name: 'OLAS Govern',
  description: 'OLAS Govern Web3 Modal',
  url: 'https://govern.olas.network',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const wagmiConfig = defaultWagmiConfig({
  chains: SUPPORTED_CHAINS_WITH_RPCS as [Chain, ...Chain[]],
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
  metadata: walletConnectMetadata,
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) || chain.rpcUrls.default.http[0] }),
    {},
  ),
});
