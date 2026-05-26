import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren } from 'react';
import { WagmiProvider } from 'wagmi';

import '@rainbow-me/rainbowkit/styles.css';

import { COLOR } from 'libs/ui-theme/src';

import { wagmiConfig } from 'common-util/config/wagmi';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});

const rainbowKitTheme = lightTheme({
  accentColor: COLOR.PRIMARY,
  accentColorForeground: 'white',
  borderRadius: 'small',
  fontStack: 'system',
});

export const Web3ModalProvider = ({ children }: PropsWithChildren) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme}>{children}</RainbowKitProvider>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </QueryClientProvider>
    </WagmiProvider>
  );
};
