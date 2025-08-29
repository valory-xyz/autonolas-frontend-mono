import type { NextPage, NextPageContext } from 'next';
import { createWrapper } from 'next-redux-wrapper';

/** antd theme config */
import Layout from 'components/Layout';
import Web3ModalProvider from '../context/web3ModalProvider';
import initStore from '../store';
import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

type MyAppProps = {
  Component: NextPage;
  pageProps: Record<string, unknown>;
};

const MyApp = ({ Component, pageProps }: MyAppProps) => (
  <>
    <GlobalStyles />
    <AutonolasThemeProvider>
      <Web3ModalProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Web3ModalProvider>
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