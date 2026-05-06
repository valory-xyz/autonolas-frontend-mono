import { NextRequest, NextResponse } from 'next/server';

import { getCspHeaders } from './lib/cspHeader';
import { getRedirectUrl } from './lib/prohibitedCountries';

export const middleware = async (request: NextRequest) => {
  // Next 15 removed `NextRequest.geo`; read the same data from the Vercel
  // edge-set header instead (`x-vercel-ip-country` is what `request.geo.country`
  // pulled under the hood pre-15). Behaviour identical on Vercel; falls back
  // to undefined elsewhere, same as the previous optional-chain.
  //
  // Security note: Vercel strips inbound `x-vercel-ip-*` headers at the edge,
  // so the value here is trusted only because we deploy exclusively to Vercel.
  // If any app is ever fronted by a different proxy (Cloudflare, AWS ALB, etc.)
  // this header becomes user-controllable and the geo-block can be bypassed —
  // switch to a proxy-trusted alternative (e.g. CF-IPCountry) at that point.
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
