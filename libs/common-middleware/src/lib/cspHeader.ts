import nextSafe from 'next-safe';

const isDev = process.env.NODE_ENV !== 'production';

const WALLET_CONNECT_LINKS = [
  'https://verify.walletconnect.org',
  'https://verify.walletconnect.com',
];

const VERCEL_LINKS = ['https://vercel.com', 'https://vercel.live/'];
const APIS = ['https://api.coingecko.com/api/'];
const GATEWAY_LINKS = [
  'https://gateway.autonolas.tech/ipfs/*',
  'https://gateway.pinata.cloud/ipfs/*',
  'https://*.arweave.net/',
  'https://i.seadn.io/s/raw/files/',
  'https://www.askjimmy.xyz/images/',
];
const ALLOWED_ORIGINS = [
  // internal
  "'self'",
  'https://*.olas.network/',
  'https://*.autonolas.tech/',
  'https://pfp.staging.autonolas.tech/healthcheck',
  'https://pfp.autonolas.tech/healthcheck',

  // web3modal and wallet connect
  ...WALLET_CONNECT_LINKS,
  'https://rpc.walletconnect.com/',
  'wss://relay.walletconnect.org/',
  'wss://relay.walletconnect.com/',
  'https://explorer-api.walletconnect.com/',
  'wss://*.pusher.com/',
  'wss://www.walletlink.org/rpc',

  // binance wallet
  'wss://nbstream.binance.com/',
  'https://binance.nodereal.io/',
  'https://bscrpc.com/',
  'https://bsc-dataseed2.ninicoin.io/',

  // gnosis safe
  'https://safe-transaction-mainnet.safe.global/api/v1/',
  'https://safe-transaction-goerli.safe.global/api/',
  'https://safe-transaction-gnosis-chain.safe.global/api/',
  'https://safe-transaction-polygon.safe.global/api/',
  'https://cloudflare-eth.com/',

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
  'https://arb1.arbitrum.io/rpc',
  'https://sepolia-rollup.arbitrum.io/rpc',
  'https://rpc.gnosischain.com/',
  'https://mainnet.base.org/',
  'https://base.llamarpc.com',
  'https://sepolia.base.org/',
  'https://mainnet.optimism.io',
  'https://sepolia.optimism.io/',
  'https://forno.celo.org',
  'https://alfajores-forno.celo-testnet.org',
  'https://api.web3modal.com/',
  'https://rpc.ankr.com/',
  'https://mainnet.mode.network/',
  'https://explorer.mode.network',
  'https://rpc.mevblocker.io',
  'https://base-rpc.publicnode.com',

  // tenderly
  'https://virtual.mainnet.rpc.tenderly.co/',
  'https://virtual.gnosis.rpc.tenderly.co/',
  'https://virtual.polygon.rpc.tenderly.co/',
  'https://virtual.mode.rpc.tenderly.co/',
  'https://rpc.tenderly.co/fork/',
  'https://virtual.base.rpc.tenderly.co/',
  'https://virtual.mainnet.eu.rpc.tenderly.co/',

  // others
  'https://api.thegraph.com/',
  'https://api.studio.thegraph.com/',
  'https://sockjs-us3.pusher.com/',
  'https://programs.shyft.to/',
  'https://*.network.thegraph.com/',
  'https://gateway.thegraph.com/',
  'https://subgraph.satsuma-prod.com/',

  ...VERCEL_LINKS,
  ...APIS,
];

const SCRIPT_SRC = ["'self'", ...VERCEL_LINKS, 'https://fonts.googleapis.com/', ...APIS];

export const getCspHeaders = () => {
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
        'script-src': SCRIPT_SRC,
        'connect-src': connectSrc,
        'img-src': [
          "'self'",
          'blob:',
          'data:',
          'https://*.autonolas.tech/',
          'https://explorer-api.walletconnect.com/w3m/',
          ...WALLET_CONNECT_LINKS,
          ...GATEWAY_LINKS,
          ...VERCEL_LINKS,
        ],
        /**
         * It is less harmful to allow 'unsafe-inline' in style-src, please read the article below
         * @see https://scotthelme.co.uk/can-you-get-pwned-with-css/
         */
        'style-src': [
          "'self'",
          'https://fonts.googleapis.com/',
          "'unsafe-inline'",
          'https://vercel.live/fonts',
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ["'self'", 'https://vercel.live/', ...WALLET_CONNECT_LINKS],
      },
      permissionsPolicyDirectiveSupport: ['standard'],
    });
  };

  /**
   * Some headers might throw warnings in the console - they are safe to ignore.
   * @see https://trezy.gitbook.io/next-safe/usage/troubleshooting#why-do-i-see-so-many-unrecognized-feature-warnings
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
