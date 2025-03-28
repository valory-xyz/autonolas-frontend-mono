import type { AppProps } from 'next/app';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

// TODO: should be able to import from 'libs/ui-theme'
import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { Layout } from '../components/Layout';
import { useFetchStakingContractsList, useFetchUserVotes } from '../hooks';
import { wrapper } from '../store';
import { Meta } from 'components/Meta';

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  useFetchStakingContractsList();
  useFetchUserVotes();

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
          <Web3ModalProvider>
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
