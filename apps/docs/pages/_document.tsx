import { Head, Html, Main, NextScript } from 'next/document';
import { getInitialPropsWithSsrStyles } from '@autonolas-frontend-mono/util-ssr';

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
