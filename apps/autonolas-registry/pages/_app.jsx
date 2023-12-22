import Head from 'next/head';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

/** wagmi config */
import { WagmiConfig as WagmiConfigProvider } from 'wagmi';
import { wagmiConfig } from 'common-util/Login/config';

/** antd theme config */
import Layout from 'components/Layout';
import GlobalStyle from 'components/GlobalStyles';
import { THEME_CONFIG } from '@autonolas/frontend-library';
import { store } from '../store';

const DESC =
  'View and manage components, agents and services via the Autonolas on-chain registry.';

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  const isNotLegal = router.pathname === '/not-legal';

  return (
    <>
      <GlobalStyle />
      <Head>
        <title>Autonolas Registry</title>
        <meta name="description" content={DESC} />
      </Head>
      <Provider store={store}>
        <ConfigProvider theme={THEME_CONFIG}>
          {isNotLegal ? (
            <Component {...pageProps} />
          ) : (
            <WagmiConfigProvider config={wagmiConfig}>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </WagmiConfigProvider>
          )}
        </ConfigProvider>
      </Provider>
    </>
  );
};

MyApp.getInitialProps = async ({ Component, ctx }) => {
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
