import { NextRequest, NextResponse } from 'next/server';

import { getCspHeaders } from './lib/cspHeader';
import { getRedirectUrl } from './lib/prohibitedCountries';

export const middleware = async (request: NextRequest) => {
  const country = request.geo?.country;
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
