#!/usr/bin/env node
/**
 * Fails when a page that should pre-render its data ships an empty shell. Server rendering was
 * silently removed once before (PR #350) with every other check green; this is what catches it.
 *
 * After a build:   node scripts/check-served-text.mjs operate govern
 * Or deployed:     node scripts/check-served-text.mjs --url https://operate.olas.network operate
 * Vercel previews need VERCEL_AUTOMATION_BYPASS_SECRET set; production does not.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Pages that must carry real, server-rendered data — not just chrome. */
const EXPECTATIONS = {
  // Shape: { page, minReadableChars, minRows?, mustContain? }
  operate: [{ page: 'contracts', minReadableChars: 1500, minRows: 5 }],
  govern: [{ page: 'contracts', minReadableChars: 1500, minRows: 5 }],
  // One network is enough: the listings read one global subgraph, so every network page serves
  // the same rows. Asserting on the summary block rather than item names, which change.
  marketplace: [
    { page: 'ethereum/ai-agents', minReadableChars: 1000, mustContain: ['most recently registered'] },
    { page: 'ethereum/components', minReadableChars: 1000, mustContain: ['most recently registered'] },
    {
      page: 'ethereum/agent-blueprints',
      minReadableChars: 1000,
      mustContain: ['most recently registered'],
    },
  ],
  // Bond renders per request, so there is no build output to inspect — check a running server
  // or a deployment with --url. `/paths` is static content; `/bonding-products` still loads its
  // rows on the client, so the assertion is on the table structure and the empty-state prose.
  bond: [
    { page: 'paths', minReadableChars: 800, mustContain: ['via Balancer on Gnosis Chain'] },
    {
      page: 'bonding-products',
      minReadableChars: 800,
      // The table's own column headers, which are served whether or not there are products.
      // Deliberately not the empty-state copy: asserting that would start failing the day bond
      // actually has products to list.
      mustContain: ['OLAS minted per LP token', 'Liquidity Pool'],
    },
  ],
  // The whole app used to sit behind an `isMounted` flag in `_app.tsx`, so every page served its
  // <title> and nothing else. `docs` is static prose; `leaderboard` is the one page here that
  // fetches, and it published the words "No data" the moment the body started rendering.
  contribute: [
    { page: 'docs', minReadableChars: 1500 },
    { page: 'leaderboard', minReadableChars: 1000, minRows: 5 },
  ],
  // Same bug as launch: the guides were fetched from the browser and the whole body sat behind a
  // `loading` flag, so each page served nav, footer and a title. Two of the six, one with a
  // Service section and one without.
  build: [
    {
      page: 'paths/prediction-agents-mechs-ai-tool',
      minReadableChars: 900,
      mustContain: ['Prediction Agents', 'eligible for Build Rewards'],
    },
    {
      page: 'paths/build-your-own-service',
      minReadableChars: 700,
      mustContain: ['eligible for Build Rewards'],
    },
  ],
  launch: [
    {
      page: 'path',
      minReadableChars: 1500,
      // Body copy from steps that are never the initial selection — deliberately not the step
      // titles, which the stepper nav renders whether or not the content does. Checking titles
      // would have passed against the broken page this guard exists to catch.
      mustContain: [
        'Sit back and relax as AI agents become your DAUs',
        'Showcase your agent economy and how it all works',
      ],
    },
    // The guides used to be fetched from the browser, so both paths served the same
    // 105-character shell. A line from the body of each, not its title — the title alone would
    // pass against the shell, which already carried the path name in its nav.
    {
      page: 'paths/start-from-a-kit',
      minReadableChars: 800,
      mustContain: ['Pick a service development kit'],
    },
    {
      page: 'paths/launch-your-own-idea',
      minReadableChars: 800,
      mustContain: ['Spec your service out'],
    },
  ],
};

/** Empty-state strings that must never reach the served HTML of a data page. */
const FORBIDDEN = ['No data'];

const readableText = (html) =>
  html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Built HTML may sit under a locale dir and further route segments, so match on the path ending. */
const findPageHtml = (dir, page) => {
  if (!existsSync(dir)) return null;
  const wanted = `${page}.html`.split('/').join(sep);
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const found = findPageHtml(full, page);
      if (found) return found;
      // `sep + wanted` only — `join` always inserts a separator, and a bare `endsWith(wanted)`
      // would also match a file called `xcontracts.html`.
    } else if (full.endsWith(sep + wanted)) {
      return full;
    }
  }
  return null;
};

/** Vercel serves its login interstitial with HTTP 200, so detect it by content. */
const isProtectionInterstitial = (finalUrl, html) =>
  /vercel\.com\/(login|sso)/.test(finalUrl) || html.includes('Log in to Vercel');

async function fetchPage(baseUrl, page) {
  const url = `${baseUrl.replace(/\/$/, '')}/${page}`;
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: secret ? { 'x-vercel-protection-bypass': secret } : {},
    signal: AbortSignal.timeout(30_000),
  });
  const html = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  if (isProtectionInterstitial(res.url, html)) {
    throw new Error(
      `${url} is behind Deployment Protection — set VERCEL_AUTOMATION_BYPASS_SECRET to check it`,
    );
  }
  return { html, url };
}

const argv = process.argv.slice(2);
const urlFlag = argv.indexOf('--url');
const baseUrl = urlFlag === -1 ? null : argv[urlFlag + 1];
const apps = urlFlag === -1 ? argv : argv.filter((_, i) => i !== urlFlag && i !== urlFlag + 1);

if (urlFlag !== -1 && !baseUrl) {
  console.error('--url needs a value, e.g. --url https://operate.olas.network');
  process.exit(2);
}
if (apps.length === 0) {
  console.error('Usage: node scripts/check-served-text.mjs <app> [<app>...]');
  process.exit(2);
}

let failures = 0;
let checked = 0;

for (const app of apps) {
  const expectations = EXPECTATIONS[app];
  if (!expectations) {
    console.error(`✗ ${app}: no expectations defined in scripts/check-served-text.mjs`);
    failures += 1;
    continue;
  }

  const pagesDir = join('dist', 'apps', app, '.next', 'server', 'pages');
  for (const { page, minReadableChars, minRows, mustContain } of expectations) {
    let html;
    let source;

    if (baseUrl) {
      try {
        const fetched = await fetchPage(baseUrl, page);
        html = fetched.html;
        source = fetched.url;
      } catch (error) {
        failures += 1;
        console.error(`✗ ${app}/${page}: ${error.message}`);
        continue;
      }
    } else {
      const file = findPageHtml(pagesDir, page);
      if (!file) {
        console.warn(`- ${app}/${page}: skipped, no build output under ${pagesDir}`);
        continue;
      }
      html = readFileSync(file, 'utf8');
      source = file;
    }

    checked += 1;
    const text = readableText(html);
    const rows = (html.match(/class="ant-table-row/g) ?? []).length;
    const problems = [];

    if (text.length < minReadableChars) {
      problems.push(`only ${text.length} readable chars, expected at least ${minReadableChars}`);
    }
    if (minRows && rows < minRows) {
      problems.push(`only ${rows} table rows, expected at least ${minRows}`);
    }
    for (const phrase of mustContain ?? []) {
      if (!text.includes(phrase)) problems.push(`does not serve "${phrase}"`);
    }
    for (const phrase of FORBIDDEN) {
      if (text.includes(phrase)) problems.push(`serves the empty-state string "${phrase}"`);
    }

    if (problems.length > 0) {
      failures += 1;
      console.error(`✗ ${app}/${page} (${source})`);
      for (const problem of problems) console.error(`    ${problem}`);
    } else {
      const detail = minRows ? `, ${rows} rows` : '';
      console.log(`✓ ${app}/${page}: ${text.length} readable chars${detail}`);
    }
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} page(s) are shipping an empty shell. These pages pre-render their data on ` +
      `purpose — see each app's CLAUDE.md before changing how they render.`,
  );
  process.exit(1);
}

if (checked === 0) {
  console.error('\nNo built pages were checked. Run `nx build <app>` first.');
  process.exit(1);
}

console.log(`\n${checked} page(s) pass.`);
