import Head from 'next/head';
import React from 'react';

const SITE_URL = 'https://operate.olas.network';
const SITE_TITLE = 'Olas Operate';
const SITE_DESCRIPTION =
  'Become an Operator in the Olas ecosystem using Pearl. Run AI agents, stake assets, and earn rewards while helping to expand the crypto and AI agent network. Get involved in managing decentralized AI-powered systems today!';

type MetaProps = {
  pageTitle?: string;
  description?: string;
  pageUrl?: string;
};

export const Meta = ({ pageTitle, description, pageUrl }: MetaProps) => {
  const title = pageTitle ? `${pageTitle} | ${SITE_TITLE}` : SITE_TITLE;
  const url = `${SITE_URL}/${pageUrl}`;

  return (
    <Head>
      {/* <!-- Primary Meta Tags --> */}
      <title>{title}</title>
      <meta name="title" content={title} key="title" />
      <meta name="description" content={description || SITE_DESCRIPTION} key="description" />

      {/* <!-- Open Graph / Facebook --> */}
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:title" content={title} key="og:title" />
      <meta
        property="og:description"
        content={description || SITE_DESCRIPTION}
        key="og:description"
      />

      {/* <!-- Twitter --> */}
      <meta property="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta property="twitter:url" content={url} key="twitter:url" />
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta
        property="twitter:description"
        content={description || SITE_DESCRIPTION}
        key="twitter:description"
      />
    </Head>
  );
};
