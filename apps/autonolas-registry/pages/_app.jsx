import Head from 'next/head';
import { Provider } from 'react-redux';
import { AutonolasThemeProvider } from 'libs/ui-theme/src/lib/ThemeConfig';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

/** wagmi config */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  WagmiProvider,
  cookieStorage,
  cookieToInitialState,
  createStorage
} from 'wagmi';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { SUPPORTED_CHAINS } from '../common-util/Login/config';

/** antd theme config */
import Layout from '../components/Layout';
import GlobalStyle from '../components/GlobalStyles';
import { wrapper } from '../store';
import { COLOR } from '@autonolas/frontend-library';



const DESC =
  'View and manage components, agents and services via the Autonolas on-chain registry.';

const queryClient = new QueryClient();

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID;

const metadata = {
  name: 'Autonolas Registry',
  description: DESC,
  url: 'https://registry.olas.network/',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

/**
 * @type {import('@web3modal/wagmi').WagmiOptions}
 */
const wagmiConfig = defaultWagmiConfig({
  chains: SUPPORTED_CHAINS,
  projectId,
  metadata,
  ssr: false,
  storage: createStorage({ storage: cookieStorage }),
});

// eslint-disable-next-line jest/require-hook
createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  themeVariables: {
    '--w3m-border-radius-master': '0.7125px',
    '--w3m-font-size-master': '11px',
    '--w3m-accent': COLOR.PRIMARY,
  },
});


const MyApp = ({ Component, ...rest }) => {
  const router = useRouter();
  const isNotLegal = router.pathname === '/not-legal';
  const initialState = cookieToInitialState(wagmiConfig);
  const { store, props } = wrapper.useWrappedStore(rest);

  return (
    <>
      <GlobalStyle />
      <Head>
        <title>Autonolas Registry</title>
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

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})])
    .isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default MyApp;
