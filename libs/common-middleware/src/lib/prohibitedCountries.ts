/* eslint-disable @nx/enforce-module-boundaries */
import prohibitedCountries from 'libs/util-prohibited-data/src/lib/prohibited-countries.json';

// Apps not available to visitors from these countries due to local marketing
// restrictions. Scoped by hostname so the other apps sharing this middleware
// are unaffected.
const PAGE_RESTRICTED_COUNTRIES = ['GB'];
const RESTRICTED_HOSTNAMES = ['bond.olas.network', 'operate.olas.network', 'build.olas.network'];

export const getRedirectUrl = async (pathName: string, countryName?: string, hostname?: string) => {
  const prohibitedCountriesCode = Object.values(prohibitedCountries) as unknown as string[];
  const isProhibited = countryName ? prohibitedCountriesCode.includes(countryName) : false;
  const isPageRestricted = Boolean(
    countryName &&
      hostname &&
      PAGE_RESTRICTED_COUNTRIES.includes(countryName) &&
      RESTRICTED_HOSTNAMES.includes(hostname),
  );
  const isBlocked = isProhibited || isPageRestricted;

  if (pathName === '/not-legal') {
    return isBlocked ? null : '/';
  }
  return isBlocked ? '/not-legal' : null;
};
