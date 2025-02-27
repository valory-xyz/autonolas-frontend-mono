import Head from 'next/head';
import { createWrapper } from 'next-redux-wrapper';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

/** wagmi config */
import { WagmiConfig as WagmiConfigProvider } from 'wagmi';
import { wagmiConfig } from 'common-util/Login/config';

/** antd theme config */
import Layout from 'components/Layout';
import GlobalStyle from 'components/GlobalStyles';
import { THEME_CONFIG } from '@autonolas/frontend-library';
import initStore from '../store';

const AutonolasThemeProvider = ({ theme = THEME_CONFIG, children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return <ConfigProvider theme={theme}>{isMounted ? children : ''}</ConfigProvider>;
};

AutonolasThemeProvider.propTypes = {
  theme: PropTypes.shape({}).isRequired,
  children: PropTypes.element.isRequired,
};

const MyApp = ({ Component, pageProps }) => (
  <>
    <GlobalStyle />
    <Head>
      <title>Mech</title>
      <meta name="title" content="Manage your mechs and instruct them" />
    </Head>
    <AutonolasThemeProvider theme={THEME_CONFIG}>
      <WagmiConfigProvider config={wagmiConfig}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </WagmiConfigProvider>
    </AutonolasThemeProvider>
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
