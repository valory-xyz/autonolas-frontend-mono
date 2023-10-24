import { NextResponse } from 'next/server';
import { prohibitedCountries } from '@autonolas/frontend-library';

const prohibitedCountriesCode = Object.values(prohibitedCountries);

/**
 * Middleware to validate the country
 *
 * @param {NextRequest} request
 */
export default function validateCountryMiddleware(request) {
  const country = request.geo?.country;
  console.log(prohibitedCountriesCode);

  if (prohibitedCountriesCode.includes(country)) {
    return NextResponse.error('Blocked for legal reasons', { status: 451 });
  }

  return NextResponse.next();
}
