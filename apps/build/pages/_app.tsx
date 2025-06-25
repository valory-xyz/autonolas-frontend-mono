import { createWrapper } from "next-redux-wrapper";

/** antd theme config */
import Layout from "components/Layout";
import { AutonolasThemeProvider, GlobalStyles } from "libs/ui-theme/src";
import Web3ModalProvider from "../context/Web3ModalProvider";
import initStore from "../store";
import { NextPage, NextPageContext } from "next";

const MyApp = ({
  Component,
  pageProps,
}: {
  Component: NextPage;
  pageProps: Record<string, unknown>;
}) => (
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
  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  return { pageProps };
};

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
