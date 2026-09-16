#!/usr/bin/env node
/**
 * Post-build check: `public/llms.txt` still points at pages that exist.
 *
 * llms.txt is prose about the site, written by hand and read by nobody on the team once
 * it ships — which is how operate's went on naming agents for months after they were
 * renamed, and govern's linked a /disclaimer it never had. Prose cannot be checked, but
 * links can: every URL in the file that points at this site must resolve to a built page,
 * a static file, a redirect or a served route, and every `#fragment` must be an id on
 * that page. It also requires a `last-updated:` line, so a reader can tell how stale the
 * prose might be.
 *
 * Reads the build's `routes-manifest.json`, so it works for the Pages and App routers,
 * with or without i18n, and never touches the network. Runs after `next build`:
 *
 *   node scripts/check-llms.mjs --host www.example.com --host example.com [--next .next]
 *     [--public public] [--llms public/llms.txt]
 */

/* eslint-disable no-console -- standalone build script */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const parseArgs = (argv) => {
  const options = { hosts: [], next: '.next', public: 'public', llms: 'public/llms.txt' };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (flag === '--host') options.hosts.push(value);
    else if (flag === '--next' || flag === '--public' || flag === '--llms')
      options[flag.slice(2)] = value;
    else throw new Error(`unknown argument ${flag}`);
  }
  if (options.hosts.length === 0) throw new Error('pass at least one --host this file speaks for');
  return options;
};

/** Every `https://…` URL in the text, without trailing punctuation from the prose. */
const extractUrls = (text) =>
  [...text.matchAll(/https?:\/\/[^\s)\]>"']+/g)].map((m) => m[0].replace(/[.,;:]+$/, ''));

const readLastUpdated = (text) => {
  const match = text.match(/^last-updated:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  if (!match) return null;
  return Number.isNaN(new Date(`${match[1]}T00:00:00Z`).getTime()) ? null : match[1];
};

const hasAnchor = (html, id) =>
  new RegExp(`\\sid="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html);

/**
 * Where a site path resolves: a prerendered page (with its HTML, for the anchor check), a
 * static file, a redirect, a route rendered per request — or nowhere.
 */
const makeResolver = ({ nextDir, publicDir }) => {
  const manifest = JSON.parse(readFileSync(path.join(nextDir, 'routes-manifest.json'), 'utf8'));
  const locale = manifest.i18n?.defaultLocale;
  // Both routers: prerendered HTML sits under `server/pages` or `server/app`, with an
  // i18n default-locale folder in between when the site has one.
  const htmlRoots = ['pages', 'app']
    .map((router) => path.join(nextDir, 'server', router))
    .flatMap((root) => (locale ? [path.join(root, locale), root] : [root]));
  // Next's own trailing-slash redirect is not a page the site offers.
  const redirects = manifest.redirects.filter((r) => !r.internal).map((r) => new RegExp(r.regex));
  // Routes rendered per request have no HTML in the output; the manifest still lists them.
  const servedRoutes = [...manifest.staticRoutes, ...manifest.dynamicRoutes].map(
    (r) => new RegExp(r.regex),
  );

  return (pathname) => {
    const clean = decodeURIComponent(pathname.replace(/\/$/, '') || '/');
    for (const root of htmlRoots) {
      const candidates =
        clean === '/'
          ? [path.join(root, 'index.html')]
          : [path.join(root, `${clean}.html`), path.join(root, clean, 'index.html')];
      for (const candidate of candidates) {
        if (existsSync(candidate)) return { kind: 'page', html: readFileSync(candidate, 'utf8') };
      }
    }
    if (clean !== '/' && existsSync(path.join(publicDir, clean))) return { kind: 'file' };
    // With i18n the manifest carries redirect sources with the locale prefixed (`/en` for `/`).
    const forms = locale ? [clean, `/${locale}${clean === '/' ? '' : clean}`] : [clean];
    if (forms.some((form) => redirects.some((re) => re.test(form)))) return { kind: 'redirect' };
    // Only that the route exists can be checked; a `#fragment` on it cannot.
    if (servedRoutes.some((re) => re.test(clean))) return { kind: 'route' };
    return null;
  };
};

const checkLlms = (text, hosts, resolve) => {
  const errors = [];
  if (!readLastUpdated(text)) errors.push('no `last-updated: YYYY-MM-DD` line');

  const seen = new Set();
  for (const url of extractUrls(text)) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      errors.push(`unparseable URL ${url}`);
      continue;
    }
    if (!hosts.has(parsed.hostname)) continue;
    const key = `${parsed.pathname}#${parsed.hash}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const target = resolve(parsed.pathname);
    if (!target) {
      errors.push(`${url} — no page, file, redirect or route at ${parsed.pathname}`);
      continue;
    }
    const fragment = parsed.hash.slice(1);
    if (fragment && target.kind === 'page' && !hasAnchor(target.html, fragment)) {
      errors.push(`${url} — page exists but has no element with id="${fragment}"`);
    }
  }
  return { errors, checked: seen.size };
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const nextDir = path.resolve(options.next);
  if (!existsSync(path.join(nextDir, 'routes-manifest.json'))) {
    console.error(`No build under ${nextDir}. Run \`next build\` first.`);
    process.exit(1);
  }
  const text = readFileSync(path.resolve(options.llms), 'utf8');
  const resolve = makeResolver({ nextDir, publicDir: path.resolve(options.public) });
  const { errors, checked } = checkLlms(text, new Set(options.hosts), resolve);

  console.log(
    `Checked ${checked} own-site link(s) in llms.txt (last-updated: ${readLastUpdated(text) ?? 'missing'}).`,
  );
  if (errors.length) {
    console.error('\nllms.txt problems:\n');
    for (const error of errors) console.error(`  ${error}`);
    process.exit(1);
  }
  console.log('llms.txt links all resolve.');
};

main();
