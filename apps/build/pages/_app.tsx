import type { NextPage, NextPageContext } from 'next';

/** antd theme config */
import Layout from 'components/Layout';
import { AutonolasThemeProvider, GlobalStyles } from 'libs/ui-theme/src';

type MyAppProps = {
  Component: NextPage;
  pageProps: Record<string, unknown>;
};

const MyApp = ({ Component, pageProps }: MyAppProps) => (
  <>
    <GlobalStyles />
    <AutonolasThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
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

export default MyApp;
