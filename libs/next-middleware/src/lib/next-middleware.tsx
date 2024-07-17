import { NextRequest, NextResponse, userAgent } from 'next/server';

import { cspHeader } from './cspHeader';
import { getRedirectUrl } from './prohibitedCountries';

export const middleware = async (request: NextRequest) => {
  const country = request.geo?.country;
  const redirectUrl = await getRedirectUrl(request.nextUrl.pathname, country);

  const response = redirectUrl
    ? NextResponse.redirect(new URL(redirectUrl, request.nextUrl))
    : NextResponse.next();

  const browserName = userAgent(request)?.browser.name;
  const cspHeaders = cspHeader(browserName);

  // apply CSP headers
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#setting-headers
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
