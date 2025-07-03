import { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'react-redux';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';
import { METADATA } from 'common-util/login/config';
import Layout from 'components/Layout';
import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { wrapper } from '../store';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <>
      <GlobalStyles />
      <Head>
        <title>{METADATA.name}</title>
        <meta name="description" content={METADATA.description} />
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

export default MyApp;
