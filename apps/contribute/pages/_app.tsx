import '@ant-design/v5-patch-for-react-19';
import '@rainbow-me/rainbowkit/styles.css';
import { ApolloProvider } from '@apollo/client';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { cookieToInitialState, WagmiProvider } from 'wagmi';

import { COLOR } from 'libs/ui-theme/src';

/** antd theme config */
import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { Layout } from 'components/Layout';

/* eslint-disable-line import/no-unresolved */
import { wagmiConfig } from 'components/Login/config';
import Meta from 'components/meta';

import client from '../apolloClient';
import { store } from '../store';

const queryClient = new QueryClient();

const rainbowKitTheme = lightTheme({
  accentColor: COLOR.PRIMARY,
  accentColorForeground: 'white',
  borderRadius: 'small',
  fontStack: 'system',
});

const ContributeApp = ({ Component, pageProps }: AppProps) => {
  const initialState = cookieToInitialState(wagmiConfig);

  /**
   * Fixes hydration error caused by ServiceStatus component,
   * also, currently sidebar depends on a hook,
   * in future we can handle it using a custom request header.
   */
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <GlobalStyles />
      <Meta />

      <Provider store={store}>
        <AutonolasThemeProvider>
          {isMounted && (
            <WagmiProvider config={wagmiConfig} initialState={initialState}>
              <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={rainbowKitTheme}>
                  <ApolloProvider client={client}>
                    <Layout>
                      <Component {...pageProps} />
                    </Layout>
                  </ApolloProvider>
                </RainbowKitProvider>
              </QueryClientProvider>
            </WagmiProvider>
          )}
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

export default ContributeApp;
