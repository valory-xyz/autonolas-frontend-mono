//@ts-check

const path = require('path');
const { composePlugins, withNx } = require('@nx/next');

// Pin the file-tracing root to the monorepo root so Next 16 doesn't pick
// the wrong yarn.lock when a developer has multiple lockfiles up the tree.
const workspaceRoot = path.join(__dirname, '..', '..');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  reactStrictMode: true,
  compiler: {
    styledComponents: {
      ssr: true,
      minify: true,
    },
  },
  transpilePackages: ['@ant-design', 'rc-util'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'gateway.autonolas.tech' },
    ],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    /* eslint-disable-next-line no-param-reassign */
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
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

const composedConfig = composePlugins(...plugins)(nextConfig);

// Next 16 removed the `eslint` config key, but @nx/next's `withNx` still
// injects `eslint: { ignoreDuringBuilds: true }`. Strip it here to silence
// the "Unrecognized key(s) in object: 'eslint'" warning at build time.
// TODO: drop this wrapper once @nx/next stops injecting the `eslint` key
// (track via https://github.com/nrwl/nx/issues for a Next 16-aware release).
module.exports = async (/** @type {string} */ phase, /** @type {any} */ context) => {
  const config = /** @type {any} */ (await composedConfig(phase, context));
  delete config.eslint;
  return config;
};
