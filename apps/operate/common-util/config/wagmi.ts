import { createConfig, http } from 'wagmi';
import {
  Chain,
  arbitrum,
  base,
  celo,
  gnosis,
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
  optimism,
  base,
  arbitrum,
  celo,
  mode,
];

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
  ssr: true,
});
