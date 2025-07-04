//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  redirects: async () => [
    {
      source: '/',
      destination: '/gnosis/mechs',
      permanent: false,
    },
    {
      source: '/mechs',
      destination: '/gnosis/mechs',
      permanent: false,
    },
    {
      source: '/mech',
      destination: '/gnosis/mechs',
      permanent: false,
    },
    {
      source: '/factory',
      destination: '/gnosis/mechs',
      permanent: false,
    },
  ],
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
