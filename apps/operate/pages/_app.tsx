import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';
import { cookieToInitialState } from 'wagmi';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { wagmiConfig } from 'common-util/config/wagmi';

import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { Layout } from '../components/Layout';
import { Meta } from 'components/Meta';

const OperateApp = ({ Component, pageProps }: AppProps) => {
  const initialState = cookieToInitialState(wagmiConfig);

  return (
    <>
      <GlobalStyles />
      <Meta />

      <AutonolasThemeProvider>
        <Web3ModalProvider initialState={initialState}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </Web3ModalProvider>
      </AutonolasThemeProvider>
    </>
  );
};

export default OperateApp;
