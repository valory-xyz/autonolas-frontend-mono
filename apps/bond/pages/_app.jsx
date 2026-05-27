import '@ant-design/v5-patch-for-react-19';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { cookieToInitialState } from 'wagmi';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { wagmiConfig } from 'common-util/config/wagmi';

import Layout from 'components/Layout';
import { Meta } from 'components/Meta';

import Web3ModalProvider from '../context/Web3ModalProvider';
import { store } from '../store';

const BondApp = ({ Component, pageProps }) => {
  const router = useRouter();
  const isNotLegal = router.pathname === '/not-legal';
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

      <Provider store={store}>
        <AutonolasThemeProvider>
          {isNotLegal ? (
            <Component {...pageProps} />
          ) : (
            <>
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
            </>
          )}
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

BondApp.getInitialProps = async ({ Component, ctx }) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return { pageProps };
};

BondApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})]).isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default BondApp;
