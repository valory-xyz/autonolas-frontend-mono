//@ts-check

const objects = require('@nx/next');

const { composePlugins, withNx } = objects;

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  reactStrictMode: true,
  compiler: {
    styledComponents: {
      ssr: true,
      minify: true,
    },
  },
  webpack(config) {
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/donate',
        permanent: false,
      },
      {
        source: '/manage-solana-products',
        destination: '/manage-solana-liquidity',
        permanent: true,
      },
    ];
  },
};
const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
