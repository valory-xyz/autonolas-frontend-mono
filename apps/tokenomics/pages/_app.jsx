import Head from 'next/head';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';

/** wagmi config */
import { WagmiConfig as WagmiConfigProvider } from 'wagmi';
import { wagmiConfig } from 'common-util/Login/config';

/** antd theme config */
import Layout from 'components/Layout';
import GlobalStyle from 'components/GlobalStyles';
import { THEME_CONFIG } from '@autonolas/frontend-library';
import { useRouter } from 'next/router';
import { store } from '../store';

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  const isNotLegal = router.pathname === '/not-legal';

  return (
    <>
      <GlobalStyle />
      <Head>
        <title>Olas Tokenomics</title>
        <meta name="title" content="Olas Tokenomics" />
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
