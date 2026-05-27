import '@ant-design/v5-patch-for-react-19';
import type { NextPage, NextPageContext } from 'next';
import { createWrapper } from 'next-redux-wrapper';
import { useEffect, useState } from 'react';
import { cookieToInitialState } from 'wagmi';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

/** antd theme config */
import { wagmiConfig } from 'components/Login/config';
import Layout from 'components/Layout';
import Meta from 'components/Meta';

import Web3ModalProvider from '../context/web3ModalProvider';
import initStore from '../store';

type MyAppProps = {
  Component: NextPage;
  pageProps: Record<string, unknown>;
};

const MyApp = ({ Component, pageProps }: MyAppProps) => {
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

MyApp.getInitialProps = async ({
  Component,
  ctx,
}: {
  Component: NextPage;
  ctx: NextPageContext;
}) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return { pageProps };
};

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
