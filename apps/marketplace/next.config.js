//@ts-check

const objects = require('@nx/next');

const { composePlugins, withNx } = objects;

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.autonolas.tech',
      },
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

module.exports = composePlugins(...plugins)(nextConfig);
