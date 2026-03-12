/* eslint-disable @nx/enforce-module-boundaries */
import prohibitedCountries from 'libs/util-prohibited-data/src/lib/prohibited-countries.json';

export const getRedirectUrl = async (pathName: string, countryName?: string) => {
  const prohibitedCountriesCode = Object.values(prohibitedCountries) as unknown as string[];
  const isProhibited = countryName ? prohibitedCountriesCode.includes(countryName) : false;

  if (pathName === '/not-legal') {
    return isProhibited ? null : '/';
  }
  return isProhibited ? '/not-legal' : null;
};
