import { SeoHead } from 'libs/ui-components/src/lib/SeoHead';

const SITE_URL = 'https://launch.olas.network';
const SITE_TITLE = 'Olas Launch';
const SITE_DESCRIPTION =
  'Create and deploy AI agent economies in your ecosystem. Manage agents and AI services with Olas Launch.';
const SITE_IMAGE_URL = `${SITE_URL}/images/meta-image.png`;

type MetaProps = {
  pageTitle?: string;
  description?: string;
  pageUrl?: string;
};

export const Meta = ({ pageTitle, description, pageUrl }: MetaProps) => (
  <SeoHead
    title={pageTitle ? `${pageTitle} | ${SITE_TITLE}` : SITE_TITLE}
    description={description || SITE_DESCRIPTION}
    url={`${SITE_URL}/${pageUrl || ''}`}
    imageUrl={SITE_IMAGE_URL}
  />
);
