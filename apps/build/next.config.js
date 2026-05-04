const path = require('path');
const objects = require('@nx/next');
const { composePlugins, withNx } = objects;

// Pin the file-tracing root to the monorepo root so Next 16 doesn't pick
// the wrong yarn.lock when a developer has multiple lockfiles up the tree.
const workspaceRoot = path.join(__dirname, '..', '..');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['@ant-design', 'rc-util'],
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
