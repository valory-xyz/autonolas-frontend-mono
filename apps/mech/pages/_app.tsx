import { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'react-redux';

import { METADATA } from 'common-util/Login/config';
import GlobalStyle from 'components/GlobalStyles';
import Layout from 'components/Layout';
import { AutonolasThemeProvider } from 'context/AutonolasThemeProvider';
import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { wrapper } from '../store';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <>
      <GlobalStyle />
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
