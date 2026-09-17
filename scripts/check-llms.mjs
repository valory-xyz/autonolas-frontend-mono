#!/usr/bin/env node
/**
 * Post-build check: `public/llms.txt` and the site describe each other.
 *
 * llms.txt is prose about the site, written by hand and read by nobody on the team once
 * it ships — which is how operate's went on naming agents for months after they were
 * renamed, pearl's missed two product launches, and govern's linked a /disclaimer it never
 * had. Prose cannot be checked, but its edges can, in both directions:
 *
 *   - every URL in the file that points at this site must resolve to a built page, a
 *     static file, a redirect or a served route, and every `#fragment` to an id on that
 *     page (a dead link);
 *   - every route the site serves must be linked from the file, unless listed in
 *     `--ignore` (a page nobody told the file about — the pearl case);
 *   - the file must carry a `last-updated:` line no older than its last commit, so the
 *     stamp means "checked against the site on", not "written on".
 *
 * Reads the build's `routes-manifest.json`, so it works for the Pages and App routers,
 * with or without i18n, and never touches the network. Runs after `next build`:
 *
 *   node scripts/check-llms.mjs --host www.example.com [--host example.com]
 *     [--next .next] [--public public] [--llms public/llms.txt] [--ignore /route]...
 *
 * The same file ships in every repo; change it in one and copy it to the others.
 */

/* eslint-disable no-console -- standalone build script */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const parseArgs = (argv) => {
  const options = {
    hosts: [],
    ignore: [],
    next: '.next',
    public: 'public',
    llms: 'public/llms.txt',
  };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (value === undefined) throw new Error(`${flag} needs a value`);
    if (flag === '--host') options.hosts.push(value);
    else if (flag === '--ignore') options.ignore.push(value);
    else if (flag === '--next' || flag === '--public' || flag === '--llms') {
      options[flag.slice(2)] = value;
    } else throw new Error(`unknown argument ${flag}`);
  }
  if (options.hosts.length === 0) throw new Error('pass at least one --host this file speaks for');
  return options;
};

/** Every `https://…` URL in the text, without trailing punctuation from the prose. */
export const extractUrls = (text) =>
  [...text.matchAll(/https?:\/\/[^\s)\]>"']+/g)].map((m) => m[0].replace(/[.,;:]+$/, ''));

export const readLastUpdated = (text) => {
  const match = text.match(/^last-updated:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  if (!match) return null;
  return Number.isNaN(new Date(`${match[1]}T00:00:00Z`).getTime()) ? null : match[1];
};

const hasAnchor = (html, id) =>
  new RegExp(`\\sid="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html);

/** A path with its trailing slash removed, `/` for the root. */
const normalise = (pathname) => decodeURIComponent(pathname.replace(/\/$/, '') || '/');

/**
 * Routes no llms.txt should have to mention: API routes, Next's own error and metadata
 * routes, and anything that is a file rather than a page.
 */
const isInternalRoute = (page) =>
  page.startsWith('/api/') ||
  page.startsWith('/_') ||
  page === '/404' ||
  page === '/500' ||
  /\.[a-z0-9]+$/i.test(page);

/**
 * What the build serves, from its `routes-manifest.json`: a resolver from path to what
 * is there (a prerendered page with its HTML, a static file, a redirect, a route rendered
 * per request, or nothing), and the list of static routes a reader should be told about.
 */
export const readBuild = ({ nextDir, publicDir }) => {
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

  const resolve = (pathname) => {
    const clean = normalise(pathname);
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

  // Dynamic routes (`/blog/[id]`) have no fixed URL to demand; their index page, if any,
  // is a static route and is demanded like the rest.
  const publicRoutes = manifest.staticRoutes.map((r) => r.page).filter((p) => !isInternalRoute(p));

  return { resolve, publicRoutes };
};

/**
 * The date of the file's last commit, for comparison with its stamp. `null` where that
 * cannot be known: no git, or a shallow clone whose boundary commit would be misread as
 * the change that introduced the file.
 */
export const lastCommitDate = (file) => {
  try {
    const cwd = path.dirname(file);
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (shallow !== 'false') return null;
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Checks one llms.txt against one build. `build` is `{ resolve, publicRoutes }` as
 * `readBuild` returns it; `committed` is the file's last commit date, or null if unknown;
 * `today` is injectable for the tests.
 */
export const checkLlms = (
  text,
  { hosts, ignore = [], build, committed = null, today = new Date().toISOString().slice(0, 10) },
) => {
  const errors = [];

  const stamp = readLastUpdated(text);
  if (!stamp) errors.push('no `last-updated: YYYY-MM-DD` line');
  else if (stamp > today) errors.push(`last-updated: ${stamp} is in the future`);
  else if (committed && committed > stamp) {
    errors.push(
      `llms.txt was committed on ${committed} but says last-updated: ${stamp} — re-check it against the site and bump the line`,
    );
  }

  const linked = new Set();
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
    linked.add(normalise(parsed.pathname));
    const key = `${parsed.pathname}#${parsed.hash}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const target = build.resolve(parsed.pathname);
    if (!target) {
      errors.push(`${url} — no page, file, redirect or route at ${parsed.pathname}`);
      continue;
    }
    const fragment = parsed.hash.slice(1);
    if (fragment && target.kind === 'page' && !hasAnchor(target.html, fragment)) {
      errors.push(`${url} — page exists but has no element with id="${fragment}"`);
    }
  }

  // A file with nothing to check is a wrong --host, not a clean file.
  if (seen.size === 0) errors.push('no own-site links found — check the --host values');

  const ignored = new Set(ignore.map(normalise));
  const missing = build.publicRoutes.filter((p) => !ignored.has(p) && !linked.has(p)).sort();
  for (const page of missing) {
    errors.push(
      `${page} is served but llms.txt does not mention it — add a line, or --ignore ${page}`,
    );
  }

  return { errors, checked: seen.size, missing };
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const nextDir = path.resolve(options.next);
  if (!existsSync(path.join(nextDir, 'routes-manifest.json'))) {
    console.error(`No build under ${nextDir}. Run \`next build\` first.`);
    process.exit(1);
  }
  const llmsPath = path.resolve(options.llms);
  const text = readFileSync(llmsPath, 'utf8');
  const build = readBuild({ nextDir, publicDir: path.resolve(options.public) });
  const { errors, checked } = checkLlms(text, {
    hosts: new Set(options.hosts),
    ignore: options.ignore,
    build,
    committed: lastCommitDate(llmsPath),
  });

  console.log(
    `Checked ${checked} own-site link(s) and ${build.publicRoutes.length} served route(s) against llms.txt (last-updated: ${readLastUpdated(text) ?? 'missing'}).`,
  );
  if (errors.length) {
    console.error('\nllms.txt problems:\n');
    for (const error of errors) console.error(`  ${error}`);
    process.exit(1);
  }
  console.log('llms.txt and the site agree.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main();
}
