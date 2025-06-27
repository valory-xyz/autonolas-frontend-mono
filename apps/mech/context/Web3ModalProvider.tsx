import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createWeb3Modal } from '@web3modal/wagmi';
import { PropsWithChildren } from 'react';
import { WagmiProvider } from 'wagmi';

import { COLOR } from '@autonolas/frontend-library';

import { wagmiConfig } from 'common-util/Login/config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

createWeb3Modal({
  wagmiConfig,
  projectId: `${process.env.NEXT_PUBLIC_WALLET_PROJECT_ID}`,
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family':
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    '--w3m-accent': COLOR.PRIMARY,
    '--w3m-border-radius-master': '1.4px',
    '--w3m-font-size-master': '11px',
  },
});

export const Web3ModalProvider = ({ children }: PropsWithChildren) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </QueryClientProvider>
    </WagmiProvider>
  );
};
