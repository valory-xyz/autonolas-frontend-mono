import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { Layout } from '../components/Layout';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to my-app! T1</title>
      </Head>
      <main className="app">
        <Component {...pageProps} />
        <Layout />
      </main>
    </>
  );
}

export default CustomApp;
