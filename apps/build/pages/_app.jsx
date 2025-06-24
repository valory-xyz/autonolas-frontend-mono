import { createWrapper } from 'next-redux-wrapper';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';
import { THEME_CONFIG } from '@autonolas/frontend-library';

/** antd theme config */
import Layout from 'components/Layout';
import GlobalStyle from 'components/GlobalStyles';
import Web3ModalProvider from '../context/Web3ModalProvider';
import initStore from '../store';

const MyApp = ({ Component, pageProps }) => (
  <>
    <GlobalStyle />
    <ConfigProvider theme={THEME_CONFIG}>
      <Web3ModalProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Web3ModalProvider>
    </ConfigProvider>
  </>
);

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

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
