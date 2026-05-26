import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

import '@rainbow-me/rainbowkit/styles.css';

import { COLOR } from 'libs/ui-theme/src';

import { wagmiConfig } from 'components/Login/config';

const queryClient = new QueryClient();

const rainbowKitTheme = lightTheme({
  accentColor: COLOR.PRIMARY,
  accentColorForeground: 'white',
  borderRadius: 'small',
  fontStack: 'system',
});

export default function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
