import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { useGetMyStakingContracts } from 'hooks/useGetMyStakingContracts';
import { useHandleRoute } from 'hooks/useHandleRoute';

import Layout from '../components/Layout';
import AppKitProvider from '../context/AppKitProvider';
import { wrapper } from '../store';
import { Meta } from 'components/Meta';

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  useHandleRoute();
  useGetMyStakingContracts();

  return <>{children}</>;
};

const LaunchApp = ({ Component, ...rest }: AppProps) => {
  const { store, props } = wrapper.useWrappedStore(rest);

  return (
    <>
      <GlobalStyles />
      <Meta />

      <Provider store={store}>
        <AutonolasThemeProvider>
          <AppKitProvider>
            <DataProvider>
              <Layout>
                <Component {...props.pageProps} />
              </Layout>
            </DataProvider>
          </AppKitProvider>
        </AutonolasThemeProvider>
      </Provider>
    </>
  );
};

export default LaunchApp;
