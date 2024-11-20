import { prohibitedAddresses } from '@autonolas-frontend-mono/util-prohibited-data';

export const getRedirectUrl = async (pathName: string, countryName?: string) => {
  const prohibitedCountriesCode = Object.values(prohibitedAddresses) as unknown as string[];

  const isProhibited = countryName ? prohibitedCountriesCode.includes(countryName) : false;

  if (pathName === '/not-legal') {
    return isProhibited ? null : '/';
  }
  return isProhibited ? '/not-legal' : null;
};
