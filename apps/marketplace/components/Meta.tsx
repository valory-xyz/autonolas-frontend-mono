import Head from 'next/head';

const SITE_URL = 'https://marketplace.olas.network';
const SITE_TITLE = 'Mech Marketplace | Olas';
const SITE_DESCRIPTION =
  'Marketplace to discover, manage, and view activity of autonomous AI agents directly from the Olas on-chain registry.';
const SITE_IMAGE_URL = `${SITE_URL}/images/meta-image.png`;

type MetaProps = {
  pageTitle?: string | null;
  description?: string;
  pageUrl?: string;
  imageUrl?: string | null;
};

/**
 * Validate and sanitize image URL for use in meta tags.
 * Only allows URLs from trusted sources (HTTPS) or relative paths.
 */
const validateMetaImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;

  // Allow HTTPS URLs
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Allow relative paths
  if (imageUrl.startsWith('/')) {
    return `${SITE_URL}${imageUrl}`;
  }

  // Reject other protocols (http, ipfs://, etc.) for security
  return null;
};

/**
 * Sanitize text for use in meta tags.
 * Removes HTML tags and limits length.
 */
const sanitizeMetaText = (text: string | null | undefined, maxLength = 300): string => {
  if (!text) return '';

  let sanitized = text.replace(/<[^>]*>/g, '').trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim() + '...';
  }

  return sanitized;
};

export const Meta = ({ pageTitle, description, pageUrl, imageUrl }: MetaProps) => {
  const sanitizedTitle = sanitizeMetaText(pageTitle);
  const sanitizedDescription = sanitizeMetaText(description);
  const title = sanitizedTitle ? `${sanitizedTitle} | ${SITE_TITLE}` : SITE_TITLE;
  const url = `${SITE_URL}/${pageUrl || ''}`;
  const image = validateMetaImageUrl(imageUrl) || SITE_IMAGE_URL;

  return (
    <Head>
      {/* <!-- Primary Meta Tags --> */}
      <title>{title}</title>
      <meta name="title" content={title} key="title" />
      <meta
        name="description"
        content={sanitizedDescription || SITE_DESCRIPTION}
        key="description"
      />

      {/* <!-- Open Graph / Facebook --> */}
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:title" content={title} key="og:title" />
      <meta
        property="og:description"
        content={sanitizedDescription || SITE_DESCRIPTION}
        key="og:description"
      />
      <meta property="og:image" content={image} key="og:image" />

      {/* <!-- Twitter --> */}
      <meta property="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta property="twitter:url" content={url} key="twitter:url" />
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta
        property="twitter:description"
        content={sanitizedDescription || SITE_DESCRIPTION}
        key="twitter:description"
      />
      <meta property="twitter:image" content={image} key="twitter:image" />
    </Head>
  );
};
