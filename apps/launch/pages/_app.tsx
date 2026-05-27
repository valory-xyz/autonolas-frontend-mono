import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { cookieToInitialState } from 'wagmi';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';
import { useSuppressSafeWcRedirect } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';

import { useGetMyStakingContracts } from 'hooks/useGetMyStakingContracts';
import { useHandleRoute } from 'hooks/useHandleRoute';

import Layout from '../components/Layout';
import Web3ModalProvider from '../context/Web3ModalProvider';
import { wrapper } from '../store';
import { Meta } from 'components/Meta';

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  useHandleRoute();
  useGetMyStakingContracts();

  return <>{children}</>;
};

const LaunchApp = ({ Component, ...rest }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(rest);
  const initialState = cookieToInitialState(wagmiConfig);

  useSuppressSafeWcRedirect();

  // Defer mounting Web3ModalProvider until after first client render.
  // RainbowKit + @reown's WalletConnect pairing flow has a known race
  // condition where the first QR-modal render fails with "invalid border=0"
  // because relayer state isn't ready yet; second click works. Mounting
  // the provider client-only side-steps the race; Layout + page can SSR
  // normally and just skip wallet-aware children until isMounted flips.
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
          {isMounted ? (
            <Web3ModalProvider initialState={initialState}>
              <DataProvider>
                <Layout>
                  <Component {...props.pageProps} />
                </Layout>
              </DataProvider>
            </Web3ModalProvider>
          ) : (
            <Layout>
              <Component {...props.pageProps} />
            </Layout>
          )}
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

export default LaunchApp;
