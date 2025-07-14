import Head from 'next/head';
import PropTypes from 'prop-types';
import React from 'react';

import { META_TAGS_INFO } from 'util/constants';

type MetaProps = {
  meta?: {
    title?: string;
    description?: string;
    siteUrl?: string;
    image?: string;
  };
};

const Meta = ({ meta }: MetaProps) => {
  const metaInfo = { ...META_TAGS_INFO, ...(meta || {}) };

  return (
    <Head>
      <title>{metaInfo.title}</title>
      <meta name="title" content={metaInfo.title} key="title" />
      <meta name="description" content={metaInfo.description} key="description" />

      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:url" content={metaInfo.siteUrl} key="og:url" />
      <meta property="og:title" content={metaInfo.title} key="og:title" />
      <meta property="og:description" content={metaInfo.description} key="og.description" />
      <meta property="og:image" content={metaInfo.image} key="og:image" />

      <meta property="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta property="twitter:url" content={metaInfo.siteUrl} key="twitter:url" />
      <meta property="twitter:title" content={metaInfo.title} key="twitter:title" />
      <meta
        property="twitter:description"
        content={metaInfo.description}
        key="twitter:description"
      />
      <meta property="twitter:image" content={metaInfo.image} key="twitter:image" />
    </Head>
  );
};

Meta.propTypes = {
  meta: PropTypes.shape({}),
};

Meta.defaultProps = {
  meta: null,
};

export default Meta;
