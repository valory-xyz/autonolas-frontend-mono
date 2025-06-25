import { THEME_CONFIG } from '@autonolas/frontend-library';
import { ConfigProvider } from 'antd';
import type { NextPage, NextPageContext } from 'next';
import { createWrapper } from 'next-redux-wrapper';
import PropTypes from 'prop-types';

/** antd theme config */
import GlobalStyle from 'components/GlobalStyles';
import Layout from 'components/Layout';
import Web3ModalProvider from '../context/web3ModalProvider';
import initStore from '../store';

type MyAppProps = {
  Component: NextPage;
  pageProps: Record<string, unknown>;
};

const MyApp = ({ Component, pageProps }: MyAppProps) => (
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

MyApp.getInitialProps = async ({
  Component,
  ctx,
}: {
  Component: NextPage;
  ctx: NextPageContext;
}) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return { pageProps };
};

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})]).isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
