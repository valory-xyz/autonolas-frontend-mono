import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

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

  // Defer mounting Web3ModalProvider until after first client render.
  // RainbowKit + @reown's WalletConnect pairing flow has a known race
  // condition where the first QR-modal render fails with "invalid border=0"
  // because relayer state isn't ready yet; second click works. Mounting
  // client-only side-steps the race entirely — same pattern as contribute.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Suppress WC v2's "bring wallet to foreground" redirect for Safe-via-WC:
  // after each wallet request, the universal-provider calls
  // window.open(peerMeta.redirect.universal), which Safe sets to
  // https://app.safe.global — opening an unwanted tab. The actual prompt
  // still appears inside the user's existing Safe tab, so we just no-op
  // the redirect to keep focus there.
  useEffect(() => {
    const originalOpen = window.open;
    window.open = (url, target, features) => {
      if (typeof url === 'string' && url.includes('app.safe.global')) {
        return null;
      }
      return originalOpen.call(window, url, target, features);
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  return (
    <>
      <GlobalStyles />
      <Meta />

      <Provider store={store}>
        <AutonolasThemeProvider>
          {isMounted && (
            <Web3ModalProvider>
              <DataProvider>
                <Layout>
                  <Component {...props.pageProps} />
                </Layout>
              </DataProvider>
            </Web3ModalProvider>
          )}
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

export default LaunchApp;
