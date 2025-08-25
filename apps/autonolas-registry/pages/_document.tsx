import { Head, Html, Main, NextScript } from 'next/document';
import { getInitialPropsWithSsrStyles } from 'libs/util-ssr/src';

const MyDocument = () => (
  <Html lang="en">
    <Head>
      <link rel="icon" href="/favicon.ico" />
      <link rel="shortcut icon" href="/favicon.ico" />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

MyDocument.getInitialProps = getInitialPropsWithSsrStyles;

export default MyDocument;
