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
      destination: '/gnosis/mech',
      permanent: false,
    },
    {
      source: '/factory',
      destination: '/gnosis/mechs',
      permanent: false,
    },
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none';",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
