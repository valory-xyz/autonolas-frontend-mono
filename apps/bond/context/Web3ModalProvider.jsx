import { createWeb3Modal } from '@web3modal/wagmi';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from 'common-util/config/wagmi';
import { COLOR } from '@autonolas/frontend-library';

const queryClient = new QueryClient();

createWeb3Modal({
  wagmiConfig,
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID,
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family':
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    '--w3m-accent': COLOR.PRIMARY,
    '--w3m-border-radius-master': '0.7125px',
    '--w3m-font-size-master': '11px',
  },
});

export default function Web3ModalProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
