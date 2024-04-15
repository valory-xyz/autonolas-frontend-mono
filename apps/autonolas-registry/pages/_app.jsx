import Head from 'next/head';
import { Provider } from 'react-redux';
import { ThemeConfigProvider, createWeb3Modal } from 'libs/providers/src';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { Web3ModalProvider } from 'libs/providers/src';

/** wagmi config */
import { wagmiConfig } from '../common-util/Login/config';

/** antd theme config */
import { THEME_CONFIG } from '@autonolas/frontend-library';
import Layout from '../components/Layout';
import GlobalStyle from '../components/GlobalStyles';
import { store } from '../store';

const DESC =
  'View and manage components, agents and services via the Autonolas on-chain registry.';

createWeb3Modal(wagmiConfig);

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
        <ThemeConfigProvider theme={THEME_CONFIG}>
          {isNotLegal ? (
            <Component {...pageProps} />
          ) : (
            <Web3ModalProvider wagmiConfig={wagmiConfig}>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </Web3ModalProvider>
          )}
        </ThemeConfigProvider>
      </Provider>
    </>
  );
};

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})])
    .isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default MyApp;
