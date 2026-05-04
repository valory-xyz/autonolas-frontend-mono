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
  // pino (used by @walletconnect/logger) loads optional logger transports
  // via dynamic require. Turbopack chases all conditional imports and tries
  // to bundle the dev-only deps (tap, desm, pino-elasticsearch, etc.).
  // Treating these as external keeps Node's require for them at runtime.
  serverExternalPackages: ['pino', 'thread-stream', '@walletconnect/logger'],

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
