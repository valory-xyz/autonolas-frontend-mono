import { SeoHead } from 'libs/ui-components/src/lib/SeoHead';

const SITE_URL = 'https://govern.olas.network';
const SITE_TITLE = 'Olas Govern';
const SITE_DESCRIPTION =
  'View various contracts and join the decision-making process that drives growth in the Olas ecosystem; direct the future of Olas.';
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
