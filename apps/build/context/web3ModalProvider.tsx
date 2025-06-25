import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi';
import { WagmiProvider } from 'wagmi';

import { COLOR, W3M_BORDER_RADIUS } from 'libs/ui-theme/src';

import { wagmiConfig } from 'common-util/Login/config';

const queryClient = new QueryClient();

createWeb3Modal({
  wagmiConfig,
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family':
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    '--w3m-accent': COLOR.PRIMARY,
    '--w3m-border-radius-master': W3M_BORDER_RADIUS,
    '--w3m-font-size-master': '11px',
  },
});

export default function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
