module.exports = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
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
