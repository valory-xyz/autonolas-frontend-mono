/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from 'next/head';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';
import { AppProps } from 'next/app';

/** wagmi config */
import { WagmiConfig as WagmiConfigProvider } from 'wagmi';
import { wagmiConfig } from '../common-util/Login/config';

/** antd theme config */
import Layout from '../components/Layout';
import GlobalStyle from '../components/GlobalStyles';
import { THEME_CONFIG } from '@autonolas-frontend-mono/ui-theme';
import { store } from '../store';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <>
    <GlobalStyle />
    <Head>
      <title>Shorts.WTF</title>
      <meta name="title" content="Shorts.WTF" />
    </Head>
    <Provider store={store}>
      <ConfigProvider theme={THEME_CONFIG}>
        <WagmiConfigProvider config={wagmiConfig}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </WagmiConfigProvider>
      </ConfigProvider>
    </Provider>
  </>
);

MyApp.getInitialProps = async ({ Component, ctx }: any) => {
  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  return { pageProps };
};

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})])
    .isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default MyApp;
