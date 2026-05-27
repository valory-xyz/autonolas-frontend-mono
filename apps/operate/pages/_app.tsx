import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { cookieToInitialState } from 'wagmi';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { wagmiConfig } from 'common-util/config/wagmi';

import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { Layout } from '../components/Layout';
import { Meta } from 'components/Meta';

const OperateApp = ({ Component, pageProps }: AppProps) => {
  const initialState = cookieToInitialState(wagmiConfig);

  // Defer mounting the wallet provider until after first client render to
  // avoid the RainbowKit + WalletConnect first-click "invalid border=0"
  // race. See launch's _app.tsx for the original diagnosis.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <GlobalStyles />
      <Meta />

      <AutonolasThemeProvider>
        {isMounted ? (
          <Web3ModalProvider initialState={initialState}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Web3ModalProvider>
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </AutonolasThemeProvider>
    </>
  );
};

export default OperateApp;
