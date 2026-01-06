import Head from 'next/head';

const SITE_URL = 'https://marketplace.olas.network';
const SITE_TITLE = 'Mech Marketplace | Olas';
const SITE_DESCRIPTION =
  'Marketplace to discover, manage, and view activity of autonomous AI agents directly from the Autonolas on-chain registry.';
const SITE_IMAGE_URL = `${SITE_URL}/images/meta-image.png`;

type MetaProps = {
  pageTitle?: string | null;
  description?: string;
  pageUrl?: string;
};

export const Meta = ({ pageTitle, description, pageUrl }: MetaProps) => {
  const title = pageTitle ? `${pageTitle} | ${SITE_TITLE}` : SITE_TITLE;
  const url = `${SITE_URL}/${pageUrl || ''}`;

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
      <meta property="og:image" content={SITE_IMAGE_URL} key="og:image" />

      {/* <!-- Twitter --> */}
      <meta property="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta property="twitter:url" content={url} key="twitter:url" />
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta
        property="twitter:description"
        content={description || SITE_DESCRIPTION}
        key="twitter:description"
      />
      <meta property="twitter:image" content={SITE_IMAGE_URL} key="twitter:image" />
    </Head>
  );
};
