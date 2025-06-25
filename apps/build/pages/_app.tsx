import type { NextPage, NextPageContext } from 'next';
import { createWrapper } from 'next-redux-wrapper';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';
import { THEME_CONFIG } from '@autonolas/frontend-library';

/** antd theme config */
import Layout from 'components/Layout';
import GlobalStyle from 'components/GlobalStyles';
import Web3ModalProvider from '../context/web3ModalProvider';
import initStore from '../store';

type MyAppProps = {
  Component: React.ComponentType<any>;
  pageProps: any;
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
