import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { cookieToInitialState } from 'wagmi';

// TODO: should be able to import from 'libs/ui-theme'
import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';
import { useSuppressSafeWcRedirect } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';

import { Meta } from 'components/Meta';
import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { Layout } from '../components/Layout';
import { useFetchStakingContractsList } from '../hooks';
import { wrapper } from '../store';

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  useFetchStakingContractsList();

  return <>{children}</>;
};

const GovernApp = ({ Component, ...rest }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(rest);
  const initialState = cookieToInitialState(wagmiConfig);

  useSuppressSafeWcRedirect();

  return (
    <>
      <GlobalStyles />
      <Meta />

      <Provider store={store}>
        <AutonolasThemeProvider>
          <Web3ModalProvider initialState={initialState}>
            <DataProvider>
              <Layout>
                <Component {...props.pageProps} />
              </Layout>
            </DataProvider>
          </Web3ModalProvider>
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

export default GovernApp;
