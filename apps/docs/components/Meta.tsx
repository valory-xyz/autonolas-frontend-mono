import { SeoHead } from 'libs/ui-components/src/lib/SeoHead';

const SITE_TITLE = 'Docs | Olas';
const SITE_DESCRIPTION =
  'Learn what Olas is, explore what you can build and use with it, and discover how to get involved—tailored to your role in the ecosystem.';
const SITE_URL = 'https://docs.olas.network/';
const SITE_DEFAULT_IMAGE_URL = `${SITE_URL}meta-image.png`;

type MetaProps = {
  title?: string | null;
  description?: string;
  path?: string;
};

const Meta = ({ title, description, path }: MetaProps) => (
  <SeoHead
    title={title ? `${title} | ${SITE_TITLE}` : SITE_TITLE}
    description={description || SITE_DESCRIPTION}
    siteUrl={SITE_URL}
    url={path ? `${SITE_URL}${path}` : undefined}
    imageUrl={SITE_DEFAULT_IMAGE_URL}
  />
);

export default Meta;
