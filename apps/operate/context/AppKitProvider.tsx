import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren } from 'react';
import { WagmiProvider } from 'wagmi';

import { COLOR, W3M_BORDER_RADIUS } from 'libs/ui-theme/src';

import { SUPPORTED_CHAINS, appKitMetadata, wagmiAdapter } from 'common-util/config/wagmi';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: SUPPORTED_CHAINS,
  metadata: appKitMetadata,
  projectId: `${process.env.NEXT_PUBLIC_WALLET_PROJECT_ID}`,
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family':
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    '--w3m-accent': COLOR.PRIMARY,
    '--w3m-border-radius-master': W3M_BORDER_RADIUS,
    '--w3m-font-size-master': '11px',
  },
  features: { analytics: false, email: false, socials: false },
});

export const AppKitProvider = ({ children }: PropsWithChildren) => {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
};
