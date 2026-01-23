import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

/** antd theme config */
import Layout from 'components/Layout';
import Meta from 'components/Meta';

import Web3ModalProvider from '../context/web3ModalProvider';
import { wrapper } from '../store';

const MyApp = ({ Component, ...rest }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(rest);

  return (
    <>
      <GlobalStyles />
      <Meta />
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
