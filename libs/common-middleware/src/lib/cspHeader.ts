import nextSafe from 'next-safe';

const isDev = process.env.NODE_ENV !== 'production';

const WALLET_CONNECT_LINKS = [
  'https://verify.walletconnect.org',
  'https://verify.walletconnect.com',
];

const ALLOWED_ORIGINS = [
  // internal
  "'self'",
  'https://*.olas.network/',
  'https://*.autonolas.tech/',

  // web3modal and wallet connect
  ...WALLET_CONNECT_LINKS,
  'https://rpc.walletconnect.com/',
  'wss://relay.walletconnect.org/',
  'wss://relay.walletconnect.com/',
  'https://explorer-api.walletconnect.com/',
  'wss://*.pusher.com/',
  'wss://www.walletlink.org/rpc',

  // gnosis safe
  'https://safe-transaction-mainnet.safe.global/api/v1/',
  'https://safe-transaction-goerli.safe.global/api/',
  'https://safe-transaction-gnosis-chain.safe.global/api/',
  'https://safe-transaction-polygon.safe.global/api/',

  // vercel
  'https://vercel.live/',

  // chains
  'https://eth-mainnet.g.alchemy.com/v2/',
  'https://eth-goerli.g.alchemy.com/v2/',
  'https://gno.getblock.io/',
  'https://polygon-mainnet.g.alchemy.com/v2/',
  'https://polygon-mumbai-bor.publicnode.com/',
  'https://rpc.chiado.gnosis.gateway.fm/',
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
];

export const cspHeader = () => {
  if (!process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL) return [];

  const connectSrc: CSPDirective = [
    ...ALLOWED_ORIGINS,

    // env variables
    process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL,
  ];

  if (isDev) {
    connectSrc.push('http://localhost');
    connectSrc.push('ws://localhost');
  }

  const scriptSrc = ["'self'", 'https://vercel.live/', 'https://fonts.googleapis.com/'];

  const getNextSafeHeaders = () => {
    if (typeof nextSafe !== 'function') return [];

    // @ts-expect-error: For some reason, TypeScript is not recognizing the function
    return nextSafe({
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
          ...WALLET_CONNECT_LINKS,
        ],
        'style-src': ["'self'", 'https://fonts.googleapis.com/', "'unsafe-inline'"],
        'frame-src': ["'self'", 'https://vercel.live/', ...WALLET_CONNECT_LINKS],
      },
      permissionsPolicyDirectiveSupport: ['standard'],
    });
  };

  /**
   * Some headers might throw warnings in the console - they are safe to ignore.
   * https://trezy.gitbook.io/next-safe/usage/troubleshooting#why-do-i-see-so-many-unrecognized-feature-warnings
   */
  const headers = [
    ...getNextSafeHeaders(),
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    },
  ];

  return headers;
};
