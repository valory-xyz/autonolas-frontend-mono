import Head from 'next/head';
import { Provider } from 'react-redux';
import { AutonolasThemeProvider } from 'libs/ui-theme/src/lib/ThemeConfig';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

/** wagmi config */
import { WagmiConfig as WagmiConfigProvider } from 'wagmi';
import { wagmiConfig } from '../common-util/Login/config';

/** antd theme config */
import Layout from '../components/Layout';
import GlobalStyle from '../components/GlobalStyles';
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
        <AutonolasThemeProvider>
          {isNotLegal ? (
            <Component {...pageProps} />
          ) : (
            <WagmiConfigProvider config={wagmiConfig}>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </WagmiConfigProvider>
          )}
        </AutonolasThemeProvider>
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
