import { createConfig, http } from 'wagmi';
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
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

import { virtualGnosis, virtualMainnet, virtualPolygon, virtualMode } from '../../tenderly.config';
import { RPC_URLS } from 'libs/util-constants/src';

const mainnetChain =
  process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true' ? virtualMainnet : mainnet;
const gnosisChain =
  process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true' ? virtualGnosis : gnosis;
const polygonChain =
  process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true' ? virtualPolygon : polygon;
const modeChain = process.env.NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET === 'true' ? virtualMode : mode;

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [
  mainnetChain,
  gnosisChain,
  polygonChain,
  modeChain,
  optimism,
  base,
  arbitrum,
  celo,
  ...(process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true' ? [hardhat] : []),
];

const walletConnectMetadata = {
  name: 'OLAS Launch',
  description: 'OLAS Launch Web3 Modal',
  url: 'https://launch.olas.network',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
      metadata: walletConnectMetadata,
      showQrModal: false,
    }),
    safe(),
    coinbaseWallet({
      appName: walletConnectMetadata.name,
    }),
  ],
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
});
