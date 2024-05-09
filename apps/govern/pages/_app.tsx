import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'react-redux';

// TODO: should be able to import from 'libs/ui-theme'
import { GlobalStyles } from 'libs/ui-theme/src/lib/GlobalStyles';
import { AutonolasThemeProvider } from 'libs/ui-theme/src/lib/ThemeConfig';

import Layout from '../components/Layout';
import { wrapper } from '../store';
import Web3ModalProvider from '../context/Web3ModalProvider';

const GovernApp = ({ Component, ...rest }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(rest);

  return (
    <>
      <GlobalStyles />
      <Head>
        <title>Govern</title>
      </Head>
      <Provider store={store}>
        <AutonolasThemeProvider>
          <Web3ModalProvider>
              <Layout>
                <Component {...props.pageProps} />
              </Layout>
          </Web3ModalProvider>
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

export default GovernApp;
