const objects = require('@nx/next');
const { composePlugins, withNx } = objects;

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['@ant-design', 'rc-util'],
  images: {
    domains: [],
  },
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  redirects: async () => [
    {
      source: '/',
      destination: '/hire',
      permanent: false,
    },
  ],
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
