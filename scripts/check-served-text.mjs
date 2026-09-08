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
 * Note it asserts on built output, so it only means something where a real build has run with
 * the RPC and subgraph env vars set. With no build output for an app it reports a skip rather
 * than a pass, so an empty CI run cannot look like a green one.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Pages that must carry real, server-rendered data — not just chrome. */
const EXPECTATIONS = {
  // Each app registers the pages it pre-renders, in the PR that makes them pre-render.
  // Shape: { page, minReadableChars, minRows?, mustContain? }
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

/** Built HTML may sit under a locale directory (i18n), so search for the file. */
const findPageHtml = (dir, page) => {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const found = findPageHtml(full, page);
      if (found) return found;
    } else if (entry === `${page}.html`) {
      return full;
    }
  }
  return null;
};

const apps = process.argv.slice(2);
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
    const file = findPageHtml(pagesDir, page);
    if (!file) {
      console.warn(`- ${app}/${page}: skipped, no build output under ${pagesDir}`);
      continue;
    }

    checked += 1;
    const html = readFileSync(file, 'utf8');
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
      console.error(`✗ ${app}/${page} (${file})`);
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
