import { SeoHead } from 'libs/ui-components/src/lib/SeoHead';

const SITE_TITLE = 'Build | Olas';
const SITE_DESCRIPTION =
  'Explore paths to build on Olas and contribute code. Builders may earn OLAS rewards when developer incentives are active.';
const SITE_URL = 'https://build.olas.network/';
const SITE_DEFAULT_IMAGE_URL = `${SITE_URL}images/metatags-image.png`;

type MetaProps = {
  title?: string | null;
  description?: string;
  path?: string;
};

const Meta = ({ title, description, path }: MetaProps) => (
  <SeoHead
    title={title ? `${title} | ${SITE_TITLE}` : SITE_TITLE}
    description={description || SITE_DESCRIPTION}
    url={`${SITE_URL}${path || ''}`}
    imageUrl={SITE_DEFAULT_IMAGE_URL}
  />
);

export default Meta;
