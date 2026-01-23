import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { WagmiProvider, cookieStorage, cookieToInitialState, createStorage } from 'wagmi';
import { Chain } from 'wagmi/chains';

// TODO: should be able to import from 'libs/ui-theme'
import { AutonolasThemeProvider, COLOR, GlobalStyles, W3M_BORDER_RADIUS } from 'libs/ui-theme/src';

import { SUPPORTED_CHAINS } from '../common-util/Login/config';
import Layout from '../components/Layout';
import { Meta } from '../components/Meta';
import { wrapper } from '../store';

const DESC =
  'Marketplace to discover, manage, and view activity of autonomous AI agents directly from the Olas on-chain registry.';
const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;
const metadata = {
  name: 'Mech Marketplace | Olas',
  description: DESC,
  url: 'https://marketplace.olas.network/',
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
      <Meta />
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
  // Add timeout to prevent hanging during build
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('getInitialProps timeout')), 5000);
  });
  
  const pagePropsPromise = Component.getInitialProps 
    ? Component.getInitialProps(ctx) 
    : Promise.resolve({});
  
  try {
    const pageProps = await Promise.race([pagePropsPromise, timeoutPromise]);
    return { pageProps };
  } catch (error) {
    // If timeout or error, return empty props to allow build to continue
    console.warn('getInitialProps error or timeout:', error);
    return { pageProps: {} };
  }
};

RegistryApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})]).isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default RegistryApp;
