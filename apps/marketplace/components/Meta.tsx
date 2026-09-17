import { SeoHead } from 'libs/ui-components/src/lib/SeoHead';

import { sanitizeMetaText, validateMetaImageUrl } from '../common-util/functions/ipfs';

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

export const Meta = ({ pageTitle, description, pageUrl, imageUrl }: MetaProps) => {
  // Titles and images here come from IPFS metadata, so they are sanitised before use.
  const sanitizedTitle = sanitizeMetaText(pageTitle);
  const sanitizedDescription = sanitizeMetaText(description);
  return (
    <SeoHead
      title={sanitizedTitle ? `${sanitizedTitle} | ${SITE_TITLE}` : SITE_TITLE}
      description={sanitizedDescription || SITE_DESCRIPTION}
      siteUrl={SITE_URL}
      url={pageUrl ? `${SITE_URL}/${pageUrl}` : undefined}
      imageUrl={validateMetaImageUrl(imageUrl) || SITE_IMAGE_URL}
    />
  );
};
