// eslint-disable-next-line @nx/enforce-module-boundaries
import { getRedirectUrl } from 'libs/common-middleware/src/lib/prohibitedCountries';

import { HomePage } from 'components/Home';
import { Meta } from 'components/Meta';

const Index = () => (
  <>
    <Meta description="Bond capital into the Olas protocol and receive OLAS at the quoted bond price after a vesting period. Explore bonding products and manage your bonds." />
    <HomePage />
  </>
);

// The edge proxy does not run for the root path on this setup (the locale
// rewrite serves it from the filesystem first), so the same geo restriction
// is enforced server-side here.
export const getServerSideProps = async ({ req }) => {
  const countryHeader = req.headers['x-vercel-ip-country'];
  const country = Array.isArray(countryHeader) ? countryHeader[0] : countryHeader;
  const redirectUrl = await getRedirectUrl('/', country, req.headers.host);

  if (redirectUrl) {
    return { redirect: { destination: redirectUrl, permanent: false } };
  }
  return { props: {} };
};

export default Index;
