import Head from 'next/head';
import PropTypes from 'prop-types';

const SITE_TITLE = 'Build | Olas';
const SITE_DESCRIPTION = 'Explore paths to build on Olas. Simplify your path to contributing and earning OLAS rewards.';
const SITE_URL = 'https://build.olas.network/';
const SITE_DEFAULT_IMAGE_URL = `${SITE_URL}/images/metatags-image.png`;

const Meta = ({ title, description, url }) => {
  const pageTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;
  return (
    <Head>
      <title>{pageTitle}</title>

      <meta name="title" content={pageTitle} />
      <meta name="description" content={description || SITE_DESCRIPTION} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url || SITE_URL} />
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={description || SITE_DESCRIPTION}
      />
      <meta property="og:image" content={SITE_DEFAULT_IMAGE_URL} />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url || SITE_URL} />
      <meta property="twitter:title" content={pageTitle} />
      <meta
        property="twitter:description"
        content={description || SITE_DESCRIPTION}
      />
      <meta property="twitter:image" content={SITE_DEFAULT_IMAGE_URL} />
    </Head>
  );
};

Meta.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};
Meta.defaultProps = {
  title: null,
  description: SITE_DESCRIPTION,
};
export default Meta;
