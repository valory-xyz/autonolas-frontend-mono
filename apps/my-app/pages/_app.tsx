import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { Badge } from 'antd';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to my-app!</title>
      </Head>
      <main className="app">
        <Badge count={5} />
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default CustomApp;
