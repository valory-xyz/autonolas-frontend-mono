import '@ant-design/v5-patch-for-react-19';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { WagmiProvider, cookieToInitialState } from 'wagmi';

// TODO: should be able to import from 'libs/ui-theme'
import { AutonolasThemeProvider, COLOR, GlobalStyles } from 'libs/ui-theme/src';

import { wagmiConfig } from '../common-util/Login/config';
import Layout from '../components/Layout';
import { Meta } from '../components/Meta';
import { wrapper } from '../store';

const queryClient = new QueryClient();

const rainbowKitTheme = lightTheme({
  accentColor: COLOR.PRIMARY,
  accentColorForeground: 'white',
  borderRadius: 'small',
  fontStack: 'system',
});

const RegistryApp = ({
  Component,
  ...rest
}: {
  // TODO: fix any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: any;
}) => {
  const router = useRouter();
  const isNotLegal = router.pathname === '/not-legal';
  const initialState = cookieToInitialState(wagmiConfig);
  const { store, props } = wrapper.useWrappedStore(rest);

  return (
    <>
      <GlobalStyles />
      <Meta />
      <Provider store={store}>
        <AutonolasThemeProvider>
          {isNotLegal ? (
            <Component {...props.pageProps} />
          ) : (
            <WagmiProvider config={wagmiConfig} initialState={initialState}>
              <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={rainbowKitTheme}>
                  <Layout>
                    <Component {...props.pageProps} />
                  </Layout>
                </RainbowKitProvider>
              </QueryClientProvider>
            </WagmiProvider>
          )}
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

type InitialProps = {
  Component: {
    getInitialProps: (ctx: {
      Component: { getInitialProps: () => Promise<Record<string, never>> };
    }) => Promise<Record<string, never>>;
  };
  ctx: { Component: { getInitialProps: () => Promise<Record<string, never>> } };
};

RegistryApp.getInitialProps = async ({ Component, ctx }: InitialProps) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};
  return { pageProps };
};

RegistryApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})]).isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default RegistryApp;
