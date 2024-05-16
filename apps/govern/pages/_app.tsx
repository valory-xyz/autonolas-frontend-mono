import { getBlock } from '@wagmi/core';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { FC, PropsWithChildren, useEffect } from 'react';
import { Provider } from 'react-redux';

// TODO: should be able to import from 'libs/ui-theme'
import { GlobalStyles } from 'libs/ui-theme/src/lib/GlobalStyles';
import { AutonolasThemeProvider } from 'libs/ui-theme/src/lib/ThemeConfig';
import { fetchAllNominees, fetchNomineesWeights, fetchUserVotes } from 'store/govern';

import { wagmiConfig } from 'common-util/config/wagmi';

import Layout from '../components/Layout';
import Web3ModalProvider from '../context/Web3ModalProvider';
import { useAppDispatch, useAppSelector, wrapper } from '../store';

const oneWeek = 7 * 86400;

const DataProvider: FC<PropsWithChildren> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { account } = useAppSelector((state) => state.setup);
  const { allNominees, userVotes } = useAppSelector((state) => state.govern);

  useEffect(() => {
    // Fetch all nominees and their aggregated weights
    dispatch(fetchAllNominees()).then((res) => {
      getBlock(wagmiConfig, {
        blockTag: 'latest',
      }).then((block) => {
        const thisWeek = Math.floor((Number(block.timestamp) + oneWeek) / oneWeek) * oneWeek;
        console.log('thisWeek', thisWeek);
        dispatch(fetchNomineesWeights({ nominees: res.payload as string[], time: thisWeek }));
        // TODO fetch next week:
        // const nextWeek = Math.floor((Number(block.timestamp) + oneWeek) / oneWeek) * oneWeek;

        // TODO: fetch titles
      });
    });
  }, [dispatch]);

  useEffect(() => {
    if (account && allNominees.length > 0 && Object.values(userVotes).length === 0) {
      dispatch(fetchUserVotes({ account, nominees: allNominees.map((item) => item.address) }));
      // todo: fetch voteUserPower, no need to fetchUserVotes if it's zero
      // todo: fetch lastUserVote, for each non zero user votes
    }
  }, [account, allNominees, dispatch, userVotes]);

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
