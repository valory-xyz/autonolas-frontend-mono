import { SeoHead } from 'libs/ui-components/src';

const SITE_URL = 'https://bond.olas.network';
const SITE_TITLE = 'Olas Bond';
const SITE_DESCRIPTION =
  'Bond capital into the Olas protocol and receive OLAS at the quoted bond price after a vesting period.';
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
