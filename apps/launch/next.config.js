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
  // Webpack is required here because Next 16's Vercel adapter mis-routes
  // static-vs-dynamic page collisions in Turbopack output (e.g.
  // `/[network]/my-staking-contracts/create` was matching `[id].tsx` with
  // id="create" instead of the static `create.tsx` page). Same fix as
  // marketplace and pearl-api. `distDir` is computed by `@nx/next/plugins/with-nx`
  // from the build target's `outputPath` in `project.json` — don't set it
  // here, or withNx will double-join the paths.
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
