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
  // Increase timeout for page data collection to handle complex getInitialProps
  staticPageGenerationTimeout: 300,
  webpack(config, { isServer }) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Force webpack to use root-level @noble packages instead of nested versions
    // This fixes issues with @reown/appkit-utils and other packages having nested @noble dependencies
    const path = require('path');
    const rootNodeModules = path.resolve(__dirname, '../../node_modules');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      // Alias @noble packages to root versions to avoid nested dependency conflicts
      '@noble/hashes/utils': path.resolve(rootNodeModules, '@noble/hashes/utils'),
      '@noble/hashes/_assert': path.resolve(rootNodeModules, '@noble/hashes/_assert'),
      '@noble/hashes': path.resolve(rootNodeModules, '@noble/hashes'),
      '@noble/curves': path.resolve(rootNodeModules, '@noble/curves'),
      // Alias ethereum-cryptography to use root @noble packages
      'ethereum-cryptography': path.resolve(rootNodeModules, 'ethereum-cryptography'),
    };
    
    // Fix missing exports from @walletconnect/utils for @web3modal/siwe
    // @web3modal/siwe depends on @walletconnect/utils@2.12.0 which doesn't have these functions
    // Use NormalModuleReplacementPlugin to replace the import with a compatible version
    const webpack = require('webpack');
    config.plugins = config.plugins || [];
    
    // Replace @walletconnect/utils imports in @web3modal/siwe with root version
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@walletconnect\/utils$/,
        (resource) => {
          // Only replace for @web3modal/siwe
          if (resource.context && resource.context.includes('@web3modal/siwe')) {
            resource.request = path.resolve(rootNodeModules, '@walletconnect/utils');
          }
        }
      )
    );
    
    // Exclude problematic Safe SDK modules from client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@safe-global/safe-apps-sdk': false,
        '@safe-global/safe-apps-provider': false,
      };
    }
    
    // Prioritize root node_modules
    config.resolve.modules = [
      rootNodeModules,
      ...(config.resolve.modules || []),
    ];
    
    // Ignore problematic modules that cause build issues
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@safe-global\/safe-apps-sdk\/node_modules\/@noble/,
      })
    );
    
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
