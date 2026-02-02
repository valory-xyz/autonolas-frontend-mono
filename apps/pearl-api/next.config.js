//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN
  ? `${process.env.NEXT_PUBLIC_ALLOWED_ORIGIN}:*`
  : "'self'";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `frame-ancestors ${allowedOrigin};`,
  },
];

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
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

  webpack(config, { isServer }) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Force webpack to use root-level packages instead of nested versions
    // This fixes issues with @toruslabs/ethereum-controllers and @web3auth having nested dependencies
    const path = require('path');
    const rootNodeModules = path.resolve(__dirname, '../../node_modules');

    config.resolve.alias = {
      ...config.resolve.alias,
      // Alias @ethereumjs packages to root versions to avoid nested dependency conflicts
      '@ethereumjs/util': path.resolve(rootNodeModules, '@ethereumjs/util'),
      '@ethereumjs/common': path.resolve(rootNodeModules, '@ethereumjs/common'),
      '@ethereumjs/tx': path.resolve(rootNodeModules, '@ethereumjs/tx'),
      // Alias @walletconnect packages to root versions to avoid nested dependency conflicts
      '@walletconnect/utils': path.resolve(rootNodeModules, '@walletconnect/utils'),
      '@walletconnect/core': path.resolve(rootNodeModules, '@walletconnect/core'),
      '@walletconnect/ethereum-provider': path.resolve(
        rootNodeModules,
        '@walletconnect/ethereum-provider',
      ),
    };

    // Replace nested @walletconnect imports with root versions
    const webpack = require('webpack');
    config.plugins = config.plugins || [];

    // Aggressively replace ALL @walletconnect imports to use root versions
    // This fixes issues with @web3auth having nested @walletconnect dependencies
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@walletconnect\/(utils|core|ethereum-provider|sign-client)$/,
        (resource) => {
          // Always replace nested @walletconnect imports with root versions
          const packageName = resource.request.match(/^@walletconnect\/(.+)$/)?.[1];
          if (packageName) {
            const rootPath = path.resolve(rootNodeModules, `@walletconnect/${packageName}`);
            // Check if root version exists before replacing
            try {
              require.resolve(rootPath);
              resource.request = rootPath;
            } catch (e) {
              // Root version doesn't exist, keep original
            }
          }
        },
      ),
    );

    // Prioritize root node_modules
    config.resolve.modules = [rootNodeModules, ...(config.resolve.modules || [])];

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
