import { AppProps } from 'next/app';
import Head from 'next/head';
import { GlobalStyles } from '@autonolas-frontend-mono/ui-theme';
import { AutonolasThemeProvider } from '@autonolas-frontend-mono/ui-theme';
import Layout from '../components/Layout';
// import Web3ModalProvider from '../context/Web3ModalProvider';
import { wrapper } from '../store';
import { Provider } from 'react-redux';

const LaunchApp = ({ Component, ...rest }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(rest);

  return (
    <>
      <GlobalStyles />
      <Head>
        <title>Launch</title>
      </Head>
      <Provider store={store}>
      <AutonolasThemeProvider>
          {/* <Web3ModalProvider> */}
            {/* <DataProvider> */}
              <Layout>
                <Component {...props.pageProps} />
              </Layout>
            {/* </DataProvider> */}
          {/* </Web3ModalProvider> */}
        </AutonolasThemeProvider>
      </Provider>
      </>
  );
}

export default LaunchApp;
