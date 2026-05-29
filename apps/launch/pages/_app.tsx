import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { cookieToInitialState } from 'wagmi';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';
import { useSuppressSafeWcRedirect } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';

import { useGetMyStakingContracts } from 'hooks/useGetMyStakingContracts';
import { useHandleRoute } from 'hooks/useHandleRoute';

import Layout from '../components/Layout';
import Web3ModalProvider from '../context/Web3ModalProvider';
import { wrapper } from '../store';
import { Meta } from 'components/Meta';

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  useHandleRoute();
  useGetMyStakingContracts();

  return <>{children}</>;
};

const LaunchApp = ({ Component, ...rest }: AppProps) => {
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

export default LaunchApp;
