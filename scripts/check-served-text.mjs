#!/usr/bin/env node
/**
 * Fails when a page that is supposed to pre-render its data ships an empty shell.
 *
 * This guard exists because the work has already been lost once: server rendering was added to
 * the operate and govern staking tables, then removed by PR #350 for unrelated performance
 * reasons, and nobody noticed until an audit measured the served HTML months later. Lint, tests
 * and typecheck all passed throughout — nothing described what these pages owe a reader who does
 * not run JavaScript.
 *
 * Run it after `nx build <app>`:
 *   node scripts/check-served-text.mjs operate govern
 *
 * Or against a deployed site — a Vercel preview, or production after a merge:
 *   node scripts/check-served-text.mjs --url https://operate.olas.network operate
 *
 * Checking a deployment is the stronger signal: it exercises the real env vars and, for ISR
 * pages, a real revalidation rather than a build-time render. Vercel preview deployments sit
 * behind Vercel Authentication, so set VERCEL_AUTOMATION_BYPASS_SECRET (Project Settings →
 * Deployment Protection → Protection Bypass for Automation) or the fetch just returns a login
 * page. Production URLs need no secret.
 *
 * Note it asserts on built output, so it only means something where a real build has run with
 * the RPC and subgraph env vars set. With no build output for an app it reports a skip rather
 * than a pass, so an empty CI run cannot look like a green one.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Pages that must carry real, server-rendered data — not just chrome. */
const EXPECTATIONS = {
  // Shape: { page, minReadableChars, minRows?, mustContain? }
  operate: [{ page: 'contracts', minReadableChars: 1500, minRows: 5 }],
  govern: [{ page: 'contracts', minReadableChars: 1500, minRows: 5 }],
  // No data fetching here — the risk is rendering only the selected step, which published one
  // step of six. Every step's content must be in the HTML whether or not it is on screen.
  // One network is enough: the listing reads a single global subgraph, so every network page
  // serves the same rows. The assertion is on the summary block, which is omitted entirely when
  // the fetch returns nothing — item names change as new units are registered, so matching those
  // would be flaky.
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
      mustContain: ['OLAS minted per LP token', 'No bonding products are available'],
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

/**
 * Built HTML may sit under a locale directory (i18n) and, for dynamic routes, under further
 * segments — so match on the path ending rather than the filename. `page` may therefore be
 * either "contracts" or "ethereum/ai-agents".
 */
const findPageHtml = (dir, page) => {
  if (!existsSync(dir)) return null;
  const wanted = `${page}.html`.split('/').join(sep);
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const found = findPageHtml(full, page);
      if (found) return found;
    } else if (full.endsWith(sep + wanted) || full.endsWith(wanted)) {
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
