import nextSafe from 'next-safe';
import { NextRequest, NextResponse, userAgent } from 'next/server';

import prohibitedCountries from 'libs/util-prohibited-data/src/lib/prohibited-countries.json';

const prohibitedCountriesCode = Object.values(prohibitedCountries);

const isDev = process.env.NODE_ENV !== 'production';

const getCspHeader = (browserName?: string) => {
  if (!process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL) return [];

  const walletconnectSrc = ['https://verify.walletconnect.org', 'https://verify.walletconnect.com'];

  const connectSrc: CSPDirective = [
    "'self'",
    ...walletconnectSrc,
    'https://*.olas.network/',
    'https://*.autonolas.tech/',
    'https://rpc.walletconnect.com/',
    'wss://relay.walletconnect.org/',
    'wss://relay.walletconnect.com/',
    'https://explorer-api.walletconnect.com/',
    'https://eth-mainnet.g.alchemy.com/v2/',
    'https://eth-goerli.g.alchemy.com/v2/',
    'https://gno.getblock.io/',
    'https://polygon-mainnet.g.alchemy.com/v2/',
    'https://polygon-mumbai-bor.publicnode.com/',
    'https://rpc.chiado.gnosis.gateway.fm/',
    'https://safe-transaction-mainnet.safe.global/api/v1/',
    'https://safe-transaction-goerli.safe.global/api/',
    'https://safe-transaction-gnosis-chain.safe.global/api/',
    'https://safe-transaction-polygon.safe.global/api/',
    'https://vercel.live/',
    'https://api.devnet.solana.com/',
    'wss://api.devnet.solana.com/',
    'https://api.mainnet-beta.solana.com/',
    'wss://api.mainnet-beta.solana.com/',
    'https://holy-convincing-bird.solana-mainnet.quiknode.pro/',
    'wss://holy-convincing-bird.solana-mainnet.quiknode.pro/',
    'https://arb1.arbitrum.io/rpc/',
    'https://sepolia-rollup.arbitrum.io/rpc',
    'https://rpc.gnosischain.com/',
    'https://mainnet.base.org/',
    'https://sepolia.base.org/',
    'https://mainnet.optimism.io',
    'https://sepolia.optimism.io/',
    'https://forno.celo.org',
    'https://alfajores-forno.celo-testnet.org',
    'https://api.web3modal.com/',
    'wss://www.walletlink.org/rpc',
    process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL,
  ];

  if (isDev) {
    connectSrc.push('http://localhost');
    connectSrc.push('ws://localhost');
  }

  const scriptSrc = ["'self'", 'https://vercel.live/', 'https://fonts.googleapis.com/'];

  // Firefox blocks inline scripts by default and it's an issue with Metamask
  // reference: https://github.com/MetaMask/metamask-extension/issues/3133
  if (browserName === 'Firefox') {
    scriptSrc.push("'unsafe-inline'");
  }

  const nextSafeHeaders =
    typeof nextSafe === 'function'
      ? // TODO
        // @ts-expect-error: For some reason, TypeScript is not recognizing the function
        nextSafe({
          isDev,
          /**
           * Content Security Policy
           * @see https://content-security-policy.com/
           */
          contentSecurityPolicy: {
            'default-src': "'none'",
            'script-src': scriptSrc,
            'connect-src': connectSrc,
            'img-src': [
              "'self'",
              'blob:',
              'data:',
              'https://*.autonolas.tech/',
              'https://explorer-api.walletconnect.com/w3m/',
              ...walletconnectSrc,
            ],
            'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com/'],
            'frame-src': ["'self'", ...walletconnectSrc],
          },
          permissionsPolicyDirectiveSupport: ['standard'],
        })
      : [];

  const headers = [
    ...nextSafeHeaders,
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    },
  ];

  return headers;
};

const getRedirectUrl = (pathName: string, countryName?: string) => {
  const isProhibited = countryName ? prohibitedCountriesCode.includes(countryName) : false;

  if (pathName === '/not-legal') {
    return isProhibited ? null : '/';
  }
  return isProhibited ? '/not-legal' : null;
};

export default async function middleware(request: NextRequest) {
  const country = request.geo?.country;
  const redirectUrl = getRedirectUrl(request.nextUrl.pathname, country);

  const response = redirectUrl
    ? NextResponse.redirect(new URL(redirectUrl, request.nextUrl))
    : NextResponse.next();

  const browserName = userAgent(request)?.browser.name;
  const cspHeaders = getCspHeader(browserName);

  // apply CSP headers
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#setting-headers
  cspHeaders.forEach((header) => {
    const { key, value } = header;
    response.headers.set(key, value);
  });

  return response;
}

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
