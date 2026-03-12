import Head from 'next/head';
import React from 'react';

import { SITE_DESCRIPTION, SITE_META_TAG_IMAGE, SITE_TITLE, SITE_URL } from 'util/constants';

type MetaProps = {
  pageTitle?: string | null;
  description?: string;
  pageUrl?: string;
};

const Meta = ({ pageTitle, description, pageUrl }: MetaProps) => {
  const title = pageTitle ? `${pageTitle} | ${SITE_TITLE}` : SITE_TITLE;
  const url = `${SITE_URL}/${pageUrl || ''}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="title" content={title} key="title" />
      <meta name="description" content={description || SITE_DESCRIPTION} key="description" />

      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:title" content={title} key="og:title" />
      <meta
        property="og:description"
        content={description || SITE_DESCRIPTION}
        key="og:description"
      />
      <meta property="og:image" content={SITE_META_TAG_IMAGE} key="og:image" />

      <meta property="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta property="twitter:url" content={url} key="twitter:url" />
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta
        property="twitter:description"
        content={description || SITE_DESCRIPTION}
        key="twitter:description"
      />
      <meta property="twitter:image" content={SITE_META_TAG_IMAGE} key="twitter:image" />
    </Head>
  );
};

export default Meta;
