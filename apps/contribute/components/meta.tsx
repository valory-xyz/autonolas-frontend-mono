import { SeoHead } from 'libs/ui-components/src/lib/SeoHead';
import { SITE_DESCRIPTION, SITE_META_TAG_IMAGE, SITE_TITLE, SITE_URL } from 'util/constants';

type MetaProps = {
  pageTitle?: string | null;
  description?: string;
  pageUrl?: string;
};

const Meta = ({ pageTitle, description, pageUrl }: MetaProps) => (
  <SeoHead
    title={pageTitle ? `${pageTitle} | ${SITE_TITLE}` : SITE_TITLE}
    description={description || SITE_DESCRIPTION}
    url={`${SITE_URL}/${pageUrl || ''}`}
    imageUrl={SITE_META_TAG_IMAGE}
  />
);

export default Meta;
