#!/usr/bin/env node
/**
 * Runs `check-llms.mjs` for one app of this monorepo, with the app's host, build output
 * and the routes its llms.txt need not mention. Keeps that knowledge here, in one place,
 * rather than spelled out per app in `project.json`.
 *
 *   node scripts/check-llms-app.mjs <app>          after `nx build <app>` (dist/apps/<app>)
 *   node scripts/check-llms-app.mjs <app> --dev    after a development build (apps/<app>/.next)
 */

/* eslint-disable no-console -- standalone build script */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/** Routes a reader need not be told about: legal boilerplate, error pages, unbuilt stubs. */
const APPS = {
  bond: { ignore: ['/not-legal'] },
  build: { ignore: ['/not-legal'] },
  // The stubs render "page does not exist" until their sections are rebuilt.
  contribute: { ignore: ['/chatbot', '/members', '/post', '/predict', '/verification'] },
  docs: { ignore: [] },
  govern: { ignore: [] },
  launch: { ignore: ['/page-not-found'] },
  marketplace: { ignore: ['/not-legal', '/page-not-found'] },
  operate: { ignore: ['/not-legal'] },
};

const [app, mode] = process.argv.slice(2);
const config = APPS[app];
if (!config || (mode && mode !== '--dev')) {
  console.error(`usage: check-llms-app.mjs <${Object.keys(APPS).join('|')}> [--dev]`);
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextDir = mode === '--dev' ? `apps/${app}/.next` : `dist/apps/${app}/.next`;

execFileSync(
  process.execPath,
  [
    path.join(root, 'scripts', 'check-llms.mjs'),
    ...['--host', `${app}.olas.network`],
    ...['--next', nextDir],
    ...['--public', `apps/${app}/public`],
    ...['--llms', `apps/${app}/public/llms.txt`],
    ...config.ignore.flatMap((route) => ['--ignore', route]),
  ],
  { cwd: root, stdio: 'inherit' },
);
