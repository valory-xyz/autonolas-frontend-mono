import { Head, Html, Main, NextScript } from 'next/document';
import { getInitialPropsWithSsrStyles } from 'libs/ui-ssr/src';

const MyDocument = () => (
  <Html lang="en">
    <Head />
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

MyDocument.getInitialProps = getInitialPropsWithSsrStyles;

export default MyDocument;
