import '@ant-design/v5-patch-for-react-19';
import type { NextPage, NextPageContext } from 'next';
import { createWrapper } from 'next-redux-wrapper';

import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

/** antd theme config */
import Layout from 'components/Layout';
import Meta from 'components/Meta';

import AppKitProvider from '../context/appKitProvider';
import initStore from '../store';

type MyAppProps = {
  Component: NextPage;
  pageProps: Record<string, unknown>;
};

const MyApp = ({ Component, pageProps }: MyAppProps) => (
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

MyApp.getInitialProps = async ({
  Component,
  ctx,
}: {
  Component: NextPage;
  ctx: NextPageContext;
}) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return { pageProps };
};

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
