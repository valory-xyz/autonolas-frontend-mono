import { createWrapper } from 'next-redux-wrapper';
import { AppProps } from 'next/app';
import Head from 'next/head';

import { METADATA } from 'common-util/Login/config';
import GlobalStyle from 'components/GlobalStyles';
import Layout from 'components/Layout';
import { AutonolasThemeProvider } from 'context/AutonolasThemeProvider';
import { Web3ModalProvider } from 'context/Web3ModalProvider';

import initStore from '../store';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <>
    <GlobalStyle />
    <Head>
      <title>{METADATA.name}</title>
      <meta name="description" content={METADATA.description} />
    </Head>
    <AutonolasThemeProvider>
      <Web3ModalProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Web3ModalProvider>
    </AutonolasThemeProvider>
  </>
);

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
