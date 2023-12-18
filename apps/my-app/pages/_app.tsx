import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { SharedUi } from '@autonolas-frontend-mono/shared-ui';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to my-app!</title>
      </Head>
      <main className="app">
        <Component {...pageProps} />
        <SharedUi />
      </main>
    </>
  );
}

export default CustomApp;
