import {
  Web3Modal,
  Web3ModalOptions,
  createWeb3Modal as createDefaultWeb3Modal,
} from '@web3modal/wagmi';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  Config,
  CreateConfigParameters,
  WagmiProvider,
  createConfig as createDefaultConfig,
  http,
} from 'wagmi';
import { injected, walletConnect, safe } from 'wagmi/connectors';
import { COLOR } from '@autonolas/frontend-library';
import { PropsWithChildren } from 'react';
import { goerli, mainnet } from 'wagmi/chains';

const defaultQueryClient = new QueryClient();

/**
 * default metadata for WalletConnect
 * just an example, you can override this with your own metadata in createWagmiConfig, via walletconnect connector options
 */
const defaultWalletConnectMetadata = {
  name: '',
  description: '',
  url: '', // origin must match domain / subdomain
  icons: [],
};

const defaultChains = [mainnet, goerli] as const; // must cast to const, otherwise it breaks

/**
 * the default wagmi config options that gets overridden by the createWagmiConfig function
 */
const defaultWagmiConfigOptions: CreateConfigParameters = {
  chains: defaultChains,
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env['NEXT_PUBLIC_WALLET_PROJECT_ID'] as string,
      metadata: defaultWalletConnectMetadata,
      showQrModal: false, // this is overridden by Web3Modal
    }),
    safe(),
  ],
  transports: {
    // use to override default transports (RPCs running on http, ws, etc)
    [mainnet.id]: http(process.env['NEXT_PUBLIC_MAINNET_URL']), // don't cast to string, undefined will default to chain's default, empty string may break it
    [goerli.id]: http(process.env['NEXT_PUBLIC_GNOSIS_URL']),
  },
};

/**
 * pass wagmiConfigOptions to create a default wagmi config
 *  */
export const createWagmiConfig = (options?: CreateConfigParameters): Config =>
  createDefaultConfig({ ...defaultWagmiConfigOptions, ...{ options } });

const defaultWagmiConfig: Config = createWagmiConfig();

/**
 * run this function to create a Web3Modal instance in your app. override the default config by passing in your own config
 * */
export const createWeb3Modal = (
  options?: Web3ModalOptions<Config>,
): Web3Modal =>
  createDefaultWeb3Modal({
    wagmiConfig: defaultWagmiConfig,
    projectId: process.env['NEXT_PUBLIC_WALLET_PROJECT_ID'] as string,
    themeMode: 'light',
    themeVariables: {
      '--w3m-font-family':
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      '--w3m-accent': COLOR.PRIMARY,
      '--w3m-border-radius-master': '0.7125px',
      '--w3m-font-size-master': '11px',
    },
    ...options,
  });

/**
 * wrap your app in this provider to use wagmi and react-query
 * */
export function Web3ModalProvider({
  children,
  wagmiConfig = defaultWagmiConfig,
  queryClient = defaultQueryClient,
}: PropsWithChildren<{
  wagmiConfig: Config;
  queryClient: QueryClient;
}>): JSX.Element {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
