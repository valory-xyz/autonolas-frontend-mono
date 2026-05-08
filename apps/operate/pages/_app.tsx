import '@ant-design/v5-patch-for-react-19';
import type { AppProps } from 'next/app';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

import { AppKitProvider } from 'context/AppKitProvider';

import { Layout } from '../components/Layout';
import { Meta } from 'components/Meta';

const OperateApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <GlobalStyles />
      <Meta />

      <AutonolasThemeProvider>
        <AppKitProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AppKitProvider>
      </AutonolasThemeProvider>
    </>
  );
};

export default OperateApp;
