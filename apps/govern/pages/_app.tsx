import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

// TODO: should be able to import from 'libs/ui-theme'
import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { Meta } from 'components/Meta';
import { AppKitProvider } from 'context/AppKitProvider';

import { Layout } from '../components/Layout';
import { useFetchStakingContractsList } from '../hooks';
import { wrapper } from '../store';

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  useFetchStakingContractsList();

  return <>{children}</>;
};

const GovernApp = ({ Component, ...rest }: AppProps) => {
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

export default GovernApp;
