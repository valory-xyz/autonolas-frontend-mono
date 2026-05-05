//@ts-check

const path = require('path');
const objects = require('@nx/next');

const { composePlugins, withNx } = objects;

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
  // Mirror @nx/next:build's output convention so `next build --webpack`
  // writes to dist/apps/govern/.next (where Vercel's Output Directory
  // looks for routes-manifest.json). Webpack is required here because Next
  // 16's Vercel adapter mis-routes static-vs-dynamic page collisions in
  // Turbopack output (e.g. `/api/contracts/batch` was matching the
  // `[chainId]` dynamic route with chainId="batch" instead of `batch.ts`).
  // Same fix as marketplace and pearl-api.
  distDir: '../../dist/apps/govern/.next',
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
  transpilePackages: ['@ant-design', 'rc-util'],
  webpack(config) {
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },
  redirects: async () => [
    {
      source: '/',
      destination: '/contracts',
      permanent: false,
    },
  ],
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
