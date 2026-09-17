#!/usr/bin/env node
/**
 * Unit tests for the llms.txt check. Run with `node --test scripts/check-llms.test.mjs`.
 *
 * Each case builds a small fake site on disk — a `routes-manifest.json` and a few HTML
 * files, exactly what `next build` leaves — so `readBuild` is tested for real, not
 * mocked. The check must fail on a dead link, a fragment the page does not carry, a page
 * the file never mentions, a stale stamp, and a file with nothing to check; and must not
 * fail on what it cannot verify (other hosts, per-request routes).
 *
 * Ships with `check-llms.mjs`; the same two files live in every repo.
 */

/* eslint-disable no-undef -- standalone test module: uses JS built-in globals */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { checkLlms, extractUrls, parseArgs, readBuild, readLastUpdated } from './check-llms.mjs';

const HOSTS = new Set(['www.example.com', 'example.com']);
const TODAY = '2026-09-17';
const HEADER = 'last-updated: 2026-09-15\n';

/**
 * A fake build: `pages` maps route → HTML (prerendered), `routes` are served without
 * HTML, `dynamic` are `[param]` routes, `redirects` are source paths. `locale` puts the
 * HTML under a default-locale folder, as an i18n site's build does.
 */
const fakeBuild = ({ pages = {}, routes = [], dynamic = [], redirects = [], locale } = {}) => {
  const root = mkdtempSync(path.join(tmpdir(), 'check-llms-'));
  const nextDir = path.join(root, '.next');
  const publicDir = path.join(root, 'public');
  const htmlDir = locale
    ? path.join(nextDir, 'server', 'pages', locale)
    : path.join(nextDir, 'server', 'pages');
  mkdirSync(publicDir, { recursive: true });
  mkdirSync(nextDir, { recursive: true });
  writeFileSync(path.join(publicDir, 'brochure.pdf'), '');

  // The shapes Next writes for `[param]`, `:param` and `:param*` sources.
  const toRegex = (page) =>
    `^${page.replace(/\/:\w+\*/g, '(?:/(.*))?').replace(/\[[^\]]+\]|:\w+/g, '([^/]+?)')}(?:/)?$`;
  const manifest = {
    i18n: locale ? { defaultLocale: locale, locales: [locale] } : undefined,
    redirects: [
      {
        source: '/:path+/',
        destination: '/:path+',
        internal: true,
        regex: '^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$',
      },
      ...redirects.map((source) => ({ source, destination: '/', regex: toRegex(source) })),
    ],
    staticRoutes: [...Object.keys(pages), ...routes].map((page) => ({
      page,
      regex: toRegex(page),
    })),
    dynamicRoutes: dynamic.map((page) => ({ page, regex: toRegex(page) })),
  };
  writeFileSync(path.join(nextDir, 'routes-manifest.json'), JSON.stringify(manifest));
  for (const [page, html] of Object.entries(pages)) {
    const file = page === '/' ? 'index.html' : `${page.slice(1)}.html`;
    mkdirSync(path.dirname(path.join(htmlDir, file)), { recursive: true });
    writeFileSync(path.join(htmlDir, file), html);
  }
  return readBuild({ nextDir, publicDir });
};

const SITE = fakeBuild({
  pages: { '/': '<div id="pearl"></div>', '/timeline': '<main></main>', '/api/health': '' },
  routes: ['/blog', '/404'],
  dynamic: ['/blog/[id]'],
  redirects: ['/protocol', '/learn/:path*'],
});

const check = (text, build = SITE, extra = {}) =>
  checkLlms(text, { hosts: HOSTS, build, today: TODAY, ...extra });

test('extractUrls drops the punctuation prose leaves on a link', () => {
  assert.deepEqual(
    extractUrls('see https://example.com/faq, and (https://example.com/timeline).'),
    ['https://example.com/faq', 'https://example.com/timeline'],
  );
});

test('a file that links every page, and whose links all resolve, is clean', () => {
  const text = `${HEADER}https://www.example.com/#pearl https://example.com/timeline https://www.example.com/blog https://www.example.com/blog/lbp-stats https://www.example.com/protocol https://www.example.com/learn/deep https://www.example.com/brochure.pdf`;
  const { errors, checked } = check(text);
  assert.deepEqual(errors, []);
  assert.equal(checked, 7);
});

test('a link to a page that no longer exists is reported', () => {
  const { errors } = check(
    `${HEADER}https://example.com/timelinez https://example.com/timeline https://example.com/ https://example.com/blog`,
  );
  assert.match(errors.join('\n'), /no page, file, redirect or route at \/timelinez/);
});

test('a fragment the page does not carry is reported', () => {
  // The drift that matters most: a section is renamed and every `#anchor` in the prose
  // silently starts landing at the top of the page.
  const { errors } = check(
    `${HEADER}https://example.com/#pearlz https://example.com/timeline https://example.com/blog`,
  );
  assert.match(errors.join('\n'), /no element with id="pearlz"/);
});

test('a page the file never mentions is reported — the pearl case', () => {
  // `/connect` and `/mini` sat on disk for weeks with no line in the file.
  const { errors, missing } = check(`${HEADER}https://example.com/ https://example.com/blog`);
  assert.deepEqual(missing, ['/timeline']);
  assert.match(errors.join('\n'), /\/timeline is served but llms.txt does not mention it/);
});

test('--ignore excuses a route; API, error and file routes need no excuse', () => {
  const { errors } = check(`${HEADER}https://example.com/ https://example.com/blog`, SITE, {
    ignore: ['/timeline/'],
  });
  assert.deepEqual(errors, []);
});

test('links to other hosts are not this file’s problem, but a file with none is', () => {
  const { errors } = check(`${HEADER}https://pearl.you/nope`);
  assert.match(errors.join('\n'), /no own-site links found/);
  assert.doesNotMatch(errors.join('\n'), /pearl\.you/);
});

test('a missing, future or stale last-updated line is reported', () => {
  const links = 'https://example.com/ https://example.com/timeline https://example.com/blog';
  assert.equal(readLastUpdated('last-updated: 2026-13-45'), null);
  assert.match(check(links).errors.join('\n'), /no `last-updated/);
  assert.match(check(`last-updated: 2027-01-01\n${links}`).errors.join('\n'), /is in the future/);
  const stale = check(`${HEADER}${links}`, SITE, { committed: '2026-09-16' });
  assert.match(
    stale.errors.join('\n'),
    /committed on 2026-09-16 but says last-updated: 2026-09-15/,
  );
  assert.deepEqual(check(`${HEADER}${links}`, SITE, { committed: '2026-09-15' }).errors, []);
});

test('an i18n build keeps its HTML and its root redirect under the locale', () => {
  const build = fakeBuild({
    pages: { '/contracts': '<h1 id="list"></h1>' },
    routes: ['/404'],
    redirects: ['/en'],
    locale: 'en',
  });
  const { errors } = check(
    `${HEADER}https://example.com/ https://example.com/contracts#list`,
    build,
  );
  assert.deepEqual(errors, []);
});

test('parseArgs needs a host and rejects what it does not know', () => {
  assert.deepEqual(parseArgs(['--host', 'a', '--host', 'b', '--ignore', '/x']).hosts, ['a', 'b']);
  assert.throws(() => parseArgs([]), /--host/);
  assert.throws(() => parseArgs(['--hosts', 'a']), /unknown argument/);
});
