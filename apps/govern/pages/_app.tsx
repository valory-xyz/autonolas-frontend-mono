import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'react-redux';
import { WagmiProvider, cookieStorage, cookieToInitialState, createStorage } from 'wagmi';

import { COLOR } from '@autonolas/frontend-library';

// TODO: should be able to import from 'libs/ui-theme'
import { GlobalStyles } from 'libs/ui-theme/src/lib/GlobalStyles';
import { AutonolasThemeProvider } from 'libs/ui-theme/src/lib/ThemeConfig';

import { SUPPORTED_CHAINS } from '../common-util/Login/config';
import Layout from '../components/Layout';
import { wrapper } from '../store';

// TODO: update metadata
const DESC = 'View and manage components, agents and services via the Autonolas on-chain registry.';
const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;
const metadata = {
  name: 'Autonolas Govern',
  description: DESC,
  url: 'https://govern.olas.network/',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const wagmiConfig = defaultWagmiConfig({
  chains: SUPPORTED_CHAINS,
  projectId,
  metadata,
  ssr: false,
  storage: createStorage({ storage: cookieStorage }),
});

createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  themeVariables: {
    '--w3m-border-radius-master': '0.7125px',
    '--w3m-font-size-master': '11px',
    '--w3m-accent': COLOR.PRIMARY,
  },
});

const GovernApp = ({ Component, ...rest }: AppProps) => {
  const initialState = cookieToInitialState(wagmiConfig);
  const { store, props } = wrapper.useWrappedStore(rest);

  return (
    <>
      <GlobalStyles />
      <Head>
        <title>Govern</title>
        <meta name="description" content={DESC} />
      </Head>
      <Provider store={store}>
        <AutonolasThemeProvider>
          <WagmiProvider config={wagmiConfig} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
              <Layout>
                <Component {...props.pageProps} />
              </Layout>
            </QueryClientProvider>
          </WagmiProvider>
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

export default GovernApp;
