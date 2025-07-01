import { ApolloProvider } from '@apollo/client';

/** wagmi config */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { WagmiProvider, cookieToInitialState } from 'wagmi';

import { COLOR } from '@autonolas/frontend-library';

/* eslint-disable-line import/no-unresolved */
import { wagmiConfig } from 'common-util/Login/config';
import Meta from 'common-util/meta';

/** antd theme config */
import GlobalStyle from 'components/GlobalStyles';
import { Layout } from 'components/Layout';
import { ThemeConfigProvider } from 'context/ConfigProvider';

import client from '../apolloClient';
import { store } from '../store';

const queryClient = new QueryClient();

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;

createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  themeVariables: {
    '--w3m-border-radius-master': '0.7125px',
    '--w3m-font-size-master': '11px',
    '--w3m-accent': COLOR.PRIMARY,
  },
  connectorImages: {
    ['wallet.binance.com']: '/images/binance-wallet.svg',
  },
  // https://docs.reown.com/cloud/wallets/wallet-list
  excludeWalletIds: [
    '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4',
    'cbc11415130d01316513f735eac34fd1ad7a5d40a993bbb6772d2c02eeef3df8',
  ],
});

const ContributeApp = ({ Component, pageProps }: AppProps) => {
  const initialState = cookieToInitialState(wagmiConfig);

  return (
    <>
      <GlobalStyle />
      <Meta />

      <Provider store={store}>
        <ThemeConfigProvider>
          <WagmiProvider config={wagmiConfig} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
              <ApolloProvider client={client}>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </ApolloProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeConfigProvider>
      </Provider>
    </>
  );
};

export default ContributeApp;
