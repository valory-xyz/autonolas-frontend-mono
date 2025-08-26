'use client';

import React from 'react';
import { GlobalStyles, AutonolasThemeProvider } from '@autonolas-frontend-mono/ui-theme';
import Layout from '../components/Layout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <title>Docs | Olas</title>
        <meta
          name="description"
          content="Learn what Olas is, explore what you can build and how to get involved."
        />
      </head>
      <body>
        <GlobalStyles />
        <AutonolasThemeProvider>
          <Layout>{children}</Layout>
        </AutonolasThemeProvider>
      </body>
    </html>
  );
}
