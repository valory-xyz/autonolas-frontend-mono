import '@ant-design/v5-patch-for-react-19';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { cookieToInitialState } from 'wagmi';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { wagmiConfig } from '../common-util/Login/config';
import Layout from '../components/Layout';
import { Meta } from '../components/Meta';
import { AppKitProvider } from '../context/AppKitProvider';
import { wrapper } from '../store';

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
            <AppKitProvider initialState={initialState}>
              <Layout>
                <Component {...props.pageProps} />
              </Layout>
            </AppKitProvider>
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
