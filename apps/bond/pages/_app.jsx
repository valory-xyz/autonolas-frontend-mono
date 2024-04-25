import Head from 'next/head';
import PropTypes from 'prop-types';

import { AutonolasThemeProvider } from 'libs/ui-theme/src/lib/ThemeConfig';

import GlobalStyle from 'components/GlobalStyles';
import Layout from 'components/Layout';
import { SITE } from 'util/meta';

const { TITLE, DESCRIPTION, URL, SITE_IMAGE_URL } = SITE;

const BondApp = ({ Component, pageProps }) => (
  <>
    <Head>
      {/* <!-- Primary Meta Tags --> */}
      <title>Bond | Olas</title>
      <meta name="title" content={TITLE} />
      <meta name="description" content={DESCRIPTION} />

      {/* <!-- Open Graph / Facebook --> */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={URL} />
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:image" content={SITE_IMAGE_URL} />

      {/* <!-- Twitter --> */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={URL} />
      <meta property="twitter:title" content={TITLE} />
      <meta property="twitter:description" content={DESCRIPTION} />
      <meta property="twitter:image" content={SITE_IMAGE_URL} />
    </Head>
    <GlobalStyle />

    <AutonolasThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AutonolasThemeProvider>
  </>
);

BondApp.getInitialProps = async ({ Component, ctx }) => {
  const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return { pageProps };
};

BondApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})]).isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

export default BondApp;
