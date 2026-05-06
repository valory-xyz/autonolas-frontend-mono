//@ts-check

const path = require('path');
const objects = require('@nx/next');

const { composePlugins, withNx } = objects;

// Pin the file-tracing root to the monorepo root so Next 16 doesn't pick
// the wrong yarn.lock when a developer has multiple lockfiles up the tree.
const workspaceRoot = path.join(__dirname, '..', '..');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  // Mirror @nx/next:build's output convention so `next build --webpack`
  // writes to dist/apps/marketplace/.next (where Vercel's Output Directory
  // looks for routes-manifest.json). Webpack is required here because Next
  // 16's Vercel adapter mis-routes static-vs-dynamic page collisions in
  // Turbopack output (e.g. `/[network]/ai-agents/mint` was matching
  // `[id].jsx` with id="mint" instead of the static `mint.jsx` page).
  distDir: '../../dist/apps/marketplace/.next',
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gateway.autonolas.tech' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
      { protocol: 'https', hostname: '*.arweave.net' },
    ],
  },
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  compiler: {
    // For other options, see https://styled-components.com/docs/tooling#babel-plugin
    styledComponents: true,
  },
  transpilePackages: ['@ant-design', 'rc-util'],
  webpack(config) {
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },
  rewrites: async () => [
    // Agent Card endpoint
    {
      source: '/erc8004/:network/ai-agents/:serviceId/agent-card.json',
      destination: '/api/erc8004/:network/ai-agents/:serviceId/agent-card.json',
    },
    // MCP descriptor endpoint
    {
      source: '/erc8004/:network/ai-agents/:serviceId/mcp.json',
      destination: '/api/erc8004/:network/ai-agents/:serviceId/mcp.json',
    },
    // Removes /api/ from the url. The endpoint can be accessed from both the paths.
    {
      source: '/erc8004/:network/ai-agents/:serviceId',
      destination: '/api/erc8004/:network/ai-agents/:serviceId',
    },
  ],
  redirects: async () => [
    {
      source: '/',
      destination: '/ethereum/ai-agents',
      permanent: true,
    },
    {
      source: '/components',
      destination: '/ethereum/components',
      permanent: true,
    },
    {
      source: '/agents',
      destination: '/ethereum/agent-blueprints',
      permanent: true,
    },
    {
      source: '/services',
      destination: '/ethereum/ai-agents',
      permanent: true,
    },
    {
      source: '/services/:id',
      destination: '/ethereum/ai-agents/:id',
      permanent: true,
    },
    {
      source: '/:network((?!api).+)/services',
      destination: '/:network/ai-agents',
      permanent: true,
    },
    {
      source: '/:network/agents',
      destination: '/:network/agent-blueprints',
      permanent: true,
    },
    {
      source: '/:network((?!api).+)/services/:id',
      destination: '/:network/ai-agents/:id',
      permanent: true,
    },
    {
      source: '/:network/mechs',
      destination: '/:network/ai-agents',
      permanent: true,
    },
    /* we used to have the mech's address as the hash on the mech service,
    while now we use the service's id, hence redirecting the user to the listing page  */
    {
      source: '/:network/mech/:id',
      destination: '/:network/ai-agents',
      permanent: true,
    },
    {
      source: '/mechs',
      destination: '/gnosis/ai-agents',
      permanent: true,
    },
    {
      source: '/mech',
      destination: '/gnosis/ai-agents',
      permanent: true,
    },
    {
      source: '/factory',
      destination: '/gnosis/ai-agents',
      permanent: true,
    },
    {
      source: '/optimism/:path*',
      destination: '/op-mainnet/:path*',
      permanent: true,
    },
    {
      source: '/mode/:path*',
      destination: '/mode-mainnet/:path*',
      permanent: true,
    },
  ],
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

const composedConfig = composePlugins(...plugins)(nextConfig);

// Next 16 removed the `eslint` config key, but @nx/next's `withNx` still
// injects `eslint: { ignoreDuringBuilds: true }`. Strip it here to silence
// the "Unrecognized key(s) in object: 'eslint'" warning at build time.
// TODO: drop this wrapper once @nx/next stops injecting the `eslint` key
// (track via https://github.com/nrwl/nx/issues for a Next 16-aware release).
module.exports = async (/** @type {string} */ phase, /** @type {any} */ context) => {
  const config = /** @type {any} */ (await composedConfig(phase, context));
  delete config.eslint;
  return config;
};
