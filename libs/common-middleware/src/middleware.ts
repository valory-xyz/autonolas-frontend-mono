import { NextRequest, NextResponse } from 'next/server';

import { getCspHeaders } from './lib/cspHeader';
import { getRedirectUrl } from './lib/prohibitedCountries';

export const middleware = async (request: NextRequest) => {
  // Next 15 removed `NextRequest.geo`; read the same data from the Vercel
  // edge-set header instead (`x-vercel-ip-country` is what `request.geo.country`
  // pulled under the hood pre-15). Behaviour identical on Vercel; falls back
  // to undefined elsewhere, same as the previous optional-chain.
  const country = request.headers.get('x-vercel-ip-country') ?? undefined;
  const redirectUrl = await getRedirectUrl(request.nextUrl.pathname, country);

  const response = redirectUrl
    ? NextResponse.redirect(new URL(redirectUrl, request.nextUrl))
    : NextResponse.next();

  const cspHeaders = getCspHeaders();

  /**
   * apply CSP headers
   * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#setting-headers
   */
  cspHeaders.forEach((header) => {
    const { key, value } = header;
    response.headers.set(key, value);
  });

  return response;
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
