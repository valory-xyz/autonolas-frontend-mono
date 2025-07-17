import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import Head from 'next/head';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { WagmiProvider, cookieStorage, cookieToInitialState, createStorage } from 'wagmi';
import { Chain } from 'wagmi/chains';

// TODO: should be able to import from 'libs/ui-theme'
import { AutonolasThemeProvider, COLOR, GlobalStyles, W3M_BORDER_RADIUS } from 'libs/ui-theme/src';

import { SUPPORTED_CHAINS } from '../common-util/Login/config';
import Layout from '../components/Layout';
import { wrapper } from '../store';

const DESC = 'View and manage components, agents and services via the Autonolas on-chain registry.';
const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;
const metadata = {
  name: 'Olas Registry',
  description: DESC,
  url: 'https://registry.olas.network/',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const wagmiConfig = defaultWagmiConfig({
  chains: SUPPORTED_CHAINS as [Chain, ...Chain[]],
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  themeVariables: {
    '--w3m-border-radius-master': W3M_BORDER_RADIUS,
    '--w3m-font-size-master': '11px',
    '--w3m-accent': COLOR.PRIMARY,
  },
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
      <Head>
        <title>Olas Registry</title>
        <meta name="description" content={DESC} />
      </Head>
      <Provider store={store}>
        <AutonolasThemeProvider>
          {isNotLegal ? (
            <Component {...props.pageProps} />
          ) : (
            <WagmiProvider config={wagmiConfig} initialState={initialState}>
              <QueryClientProvider client={queryClient}>
                <Layout>
                  <Component {...props.pageProps} />
                </Layout>
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
