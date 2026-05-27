import '@ant-design/v5-patch-for-react-19';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
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

  return (
    <>
      <GlobalStyles />
      <Meta />

      <Provider store={store}>
        <AutonolasThemeProvider>
          {isNotLegal ? (
            <Component {...pageProps} />
          ) : (
            <Web3ModalProvider initialState={initialState}>
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

BondApp.getInitialProps = async ({ Component, ctx }) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return { pageProps };
};

BondApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})]).isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default BondApp;
