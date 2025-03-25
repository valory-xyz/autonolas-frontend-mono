import type { AppProps } from 'next/app';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { Web3ModalProvider } from 'context/Web3ModalProvider';

import { Layout } from '../components/Layout';
import Meta from 'components/Meta';

const OperateApp = ({ Component, ...rest }: AppProps) => {
  return (
    <>
      <GlobalStyles />
      <Meta />

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
