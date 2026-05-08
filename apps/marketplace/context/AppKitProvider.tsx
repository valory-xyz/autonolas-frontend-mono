import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import type { Chain } from 'viem';
import { State, WagmiProvider } from 'wagmi';

import { COLOR, W3M_BORDER_RADIUS } from 'libs/ui-theme/src';

import {
  SUPPORTED_CHAINS,
  appKitMetadata,
  projectId,
  wagmiAdapter,
  wagmiConfig,
} from '../common-util/Login/config';

const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  networks: SUPPORTED_CHAINS as [Chain, ...Chain[]],
  metadata: appKitMetadata,
  projectId,
  themeMode: 'light',
  themeVariables: {
    '--w3m-border-radius-master': W3M_BORDER_RADIUS,
    '--w3m-font-size-master': '11px',
    '--w3m-accent': COLOR.PRIMARY,
  },
  features: { analytics: false, email: false, socials: false },
});

type AppKitProviderProps = PropsWithChildren<{ initialState?: State }>;

export const AppKitProvider = ({ children, initialState }: AppKitProviderProps) => (
  <WagmiProvider config={wagmiConfig} initialState={initialState}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </WagmiProvider>
);
