//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

// Pin the file-tracing root to the monorepo root so Next 16 doesn't pick
// the wrong yarn.lock when a developer has multiple lockfiles up the tree.
const workspaceRoot = path.join(__dirname, '..', '..');

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
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },

  // Mirror @nx/next:build's output convention so `next build --webpack`
  // writes to dist/apps/pearl-api/.next (where Vercel's Output Directory
  // looks for routes-manifest.json).
  distDir: '../../dist/apps/pearl-api/.next',

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
