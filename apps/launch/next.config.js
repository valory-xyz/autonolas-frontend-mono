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
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  compiler: {
    // For other options, see https://styled-components.com/docs/tooling#babel-plugin
    styledComponents: true,
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
        destination: '/path',
        permanent: false,
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
