import React from 'react';
import type { AppProps } from 'next/app';
import { GlobalStyles, AutonolasThemeProvider } from '@autonolas-frontend-mono/ui-theme';
import Layout from '../components/Layout';
import Meta from '../components/Meta';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyles />
      <Meta />
      <AutonolasThemeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AutonolasThemeProvider>
    </>
  );
}
