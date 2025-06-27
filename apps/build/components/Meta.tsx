import Head from 'next/head';

const SITE_TITLE = 'Build | Olas';
const SITE_DESCRIPTION =
  'Explore paths to build on Olas. Simplify your path to contributing and earning OLAS rewards.';
const SITE_URL = 'https://build.olas.network/';
const SITE_DEFAULT_IMAGE_URL = `${SITE_URL}images/metatags-image.png`;

type MetaProps = {
  title?: string | null;
  description?: string;
  path?: string;
};

const Meta = ({ title, description, path }: MetaProps) => {
  const pageTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;
  const pageUrl = `${SITE_URL}${path}`;

  return (
    <Head>
      <title>{pageTitle}</title>

      <meta name="title" content={pageTitle} />
      <meta name="description" content={description || SITE_DESCRIPTION} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description || SITE_DESCRIPTION} />
      <meta property="og:image" content={SITE_DEFAULT_IMAGE_URL} />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={description || SITE_DESCRIPTION} />
      <meta property="twitter:image" content={SITE_DEFAULT_IMAGE_URL} />
    </Head>
  );
};

export default Meta;
