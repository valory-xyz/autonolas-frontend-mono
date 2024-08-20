import type { AppProps } from 'next/app';
import Head from 'next/head';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { Layout } from '../components/Layout';

const OperateApp = ({ Component, ...rest }: AppProps) => {
  return (
    <>
      <GlobalStyles />
      <Head>
        <title>Operate</title>
      </Head>

      <AutonolasThemeProvider>
        <Web3ModalProvider>
          <Layout>
            <Component />
          </Layout>
        </Web3ModalProvider>
      </AutonolasThemeProvider>
    </>
  );
};

export default OperateApp;
