import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

const SITE_URL = 'https://govern.olas.network';
const SITE_TITLE = 'Olas Govern';
const SITE_DESCRIPTION =
  'View various contracts and join the decision-making process that drives growth in the Olas ecosystem; direct the future of Olas.';

const Meta = ({
  pageTitle,
  description,
  pageUrl,
}: {
  pageTitle: string;
  description: string;
  pageUrl: string;
}) => {
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

Meta.propTypes = {
  pageTitle: PropTypes.string,
  description: PropTypes.string,
  pageUrl: PropTypes.string,
};
Meta.defaultProps = {
  pageTitle: null,
  description: SITE_DESCRIPTION,
  pageUrl: '',
};

export default Meta;
