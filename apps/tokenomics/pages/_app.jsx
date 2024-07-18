import Head from 'next/head';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';

import { AutonolasThemeProvider } from 'libs/ui-theme/src';

import GlobalStyle from 'components/GlobalStyles';

/** antd theme config */
import Layout from 'components/Layout';

import Web3ModalProvider from '../context/Web3ModalProvider';
import { store } from '../store';

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  const isNotLegal = router.pathname === '/not-legal';

  return (
    <>
      <Head>
        <title>Olas Tokenomics</title>
        <meta name="title" content="Olas Tokenomics" />
      </Head>
      <GlobalStyle />
      <Provider store={store}>
        <AutonolasThemeProvider>
          {isNotLegal ? (
            <Component {...pageProps} />
          ) : (
            <Web3ModalProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </Web3ModalProvider>
          )}
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

MyApp.getInitialProps = async ({ Component, ctx }) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return { pageProps };
};

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})]).isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default MyApp;
