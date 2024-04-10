import { createWrapper } from 'next-redux-wrapper';
import PropTypes from 'prop-types';
import GlobalStyle from 'components/GlobalStyles';
import Head from 'next/head';

/** antd theme config */
import Layout from 'components/Layout';
import { useRouter } from 'next/router';
import { ThemeConfigProvider } from '../context/ConfigProvider';
import Web3ModalProvider from '../context/Web3ModalProvider';
import initStore from '../store';

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
      <ThemeConfigProvider>
        {isNotLegal ? (
          <Component {...pageProps} />
        ) : (
          <Web3ModalProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Web3ModalProvider>
        )}
      </ThemeConfigProvider>
    </>
  );
};

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})])
    .isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
