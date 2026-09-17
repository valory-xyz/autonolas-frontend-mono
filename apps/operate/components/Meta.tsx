import { SeoHead } from 'libs/ui-components/src/lib/SeoHead';

const SITE_URL = 'https://operate.olas.network';
const SITE_TITLE = 'Olas Operate';
const SITE_DESCRIPTION =
  'Become an Operator in the Olas ecosystem. Run AI agents and stake OLAS — staking rewards depend on agent activity and are not guaranteed. Get involved in running decentralized AI-powered systems.';
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
    siteUrl={SITE_URL}
    url={pageUrl ? `${SITE_URL}/${pageUrl}` : undefined}
    imageUrl={SITE_IMAGE_URL}
  />
);
