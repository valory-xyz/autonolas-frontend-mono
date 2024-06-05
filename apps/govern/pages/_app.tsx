import type { AppProps } from 'next/app';
import Head from 'next/head';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

// TODO: should be able to import from 'libs/ui-theme'
import { GlobalStyles } from 'libs/ui-theme/src/lib/GlobalStyles';
import { AutonolasThemeProvider } from 'libs/ui-theme/src/lib/ThemeConfig';

import Layout from '../components/Layout';
import Web3ModalProvider from '../context/Web3ModalProvider';
import { useFetchStakingContractsList } from '../hooks';
import { wrapper } from '../store';

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  useFetchStakingContractsList();

  // useEffect(() => {
  //   if (account && allNominees.length > 0 && Object.values(userVotes).length === 0) {
  //     dispatch(fetchUserVotes({ account, nominees: allNominees.map((item) => item.address) }));
  //     // todo: fetch voteUserPower, no need to fetchUserVotes if it's zero
  //     // todo: fetch lastUserVote, for each non zero user votes
  //   }
  // }, [account, allNominees, dispatch, userVotes]);

  return <>{children}</>;
};

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
