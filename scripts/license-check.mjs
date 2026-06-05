#!/usr/bin/env node
/**
 * License allowlist gate. Sibling of scripts/audit.mjs and scripts/audit-install-hooks.mjs.
 *
 * Engine: license-checker-rseidelsohn (reads actual LICENSE files, so packages that
 * declare no SPDX string in package.json are detected rather than reported UNKNOWN).
 *
 * Config: .supply-chain/license-allowlist.json
 *   { allowedSpdx: string[], exemptions: [{ package, reason, ... }], scope?: "production" }
 *
 * Posture: a package whose license is not on `allowedSpdx` — including
 * UNKNOWN / "Custom: <file>" / UNLICENSED — FAILS, unless its exact name is in `exemptions`.
 * Exemptions match by package NAME (version-agnostic): resilient to version bumps, but a
 * NEW unlisted package — even in an already-exempted namespace — still fails.
 *
 * Requires Node >= 18 (the pinned license-checker-rseidelsohn@4.4.2). The repo's .nvmrc
 * is 22.18.0 and CI runs Node 22.x.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const checker = require('license-checker-rseidelsohn');

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, '.supply-chain', 'license-allowlist.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const allowed = new Set((config.allowedSpdx || []).map((s) => s.trim().toLowerCase()));
// Corrections for packages that ARE permissive but the checker can't map to SPDX (e.g.
// package.json "SEE LICENSE IN LICENSE"). Applied BEFORE the allowlist check so they pass as
// their real, confirmed license — these are corrections, not policy exceptions. { name: SPDX }.
const overrides = config.licenseOverrides || {};
const exemptByName = new Map((config.exemptions || []).map((e) => [e.package, e]));
// Narrow prefixes ONLY for platform-binary families whose package name varies by OS/arch
// (e.g. @img/sharp-libvips-<platform>: darwin-arm64 locally, linux-x64 on CI), where a single
// exact name would be non-deterministic across platforms. Do NOT use for general namespaces —
// a new unlisted package must still fail the gate.
const exemptPrefixes = (config.exemptionPrefixes || []).map((e) =>
  typeof e === 'string' ? e : e.prefix,
);

const normalizeToken = (tok) =>
  String(tok)
    .replace(/^\(+|\)+$/g, '') // strip surrounding parens
    .replace(/\*+$/, '') // strip trailing '*' (license-checker "guessed from file" marker)
    .trim()
    .toLowerCase();

const tokenAllowed = (tok) => allowed.has(normalizeToken(tok));

// SPDX precedence: AND binds tighter than OR — "A AND B OR C" === "(A AND B) OR C".
const expressionAllowed = (expr) => {
  const cleaned = String(expr).replace(/^\(+|\)+$/g, '').trim();
  const orClauses = cleaned.split(/\s+OR\s+/i);
  if (orClauses.length > 1) return orClauses.some((c) => expressionAllowed(c));
  const andParts = cleaned.split(/\s+AND\s+/i);
  if (andParts.length > 1) return andParts.every((p) => expressionAllowed(p));
  return tokenAllowed(cleaned);
};

const licenseAllowed = (lic) => {
  if (!lic) return false;
  if (Array.isArray(lic)) return lic.some((l) => licenseAllowed(l)); // array => alternatives (OR)
  if (/^(unknown|unlicensed)$/i.test(lic) || /^custom:/i.test(lic)) return false; // unresolved => fail
  return expressionAllowed(lic);
};

// key is "<name>@<version>", incl. scoped "@scope/name@<version>".
const pkgName = (key) => key.slice(0, key.lastIndexOf('@'));

const initOpts = { start: ROOT, excludePrivatePackages: true };
if ((config.scope || 'production') === 'production') initOpts.production = true;

checker.init(initOpts, (err, packages) => {
  if (err) {
    console.error('license-check: failed to scan dependency tree:', err.message || err);
    process.exit(2);
  }

  const violations = [];
  const exemptedNamesHit = new Set();
  const prefixHits = new Set();
  const overrideHits = new Set();
  const installedNames = new Set();
  for (const [key, info] of Object.entries(packages)) {
    const name = pkgName(key);
    installedNames.add(name);
    const overridden = Object.prototype.hasOwnProperty.call(overrides, name);
    const effective = overridden ? overrides[name] : info.licenses;
    if (overridden && !licenseAllowed(info.licenses) && licenseAllowed(effective)) {
      overrideHits.add(name);
    }
    if (licenseAllowed(effective)) continue;
    if (exemptByName.has(name)) {
      exemptedNamesHit.add(name);
      continue;
    }
    const matchedPrefix = exemptPrefixes.find((p) => name.startsWith(p));
    if (matchedPrefix) {
      prefixHits.add(matchedPrefix);
      continue;
    }
    violations.push({
      key,
      lic: Array.isArray(info.licenses) ? info.licenses.join(' / ') : String(info.licenses),
      repo: info.repository || '',
    });
  }

  const acceptedCount = exemptedNamesHit.size + prefixHits.size;
  if (acceptedCount) {
    console.log(
      `license-check: ${acceptedCount} exempted package group(s) accepted (see .supply-chain/license-allowlist.json).`,
    );
  }
  if (overrideHits.size) {
    console.log(
      `license-check: ${overrideHits.size} license override(s) applied (permissive but mis-detected).`,
    );
  }

  // Keep the config honest: warn about entries that no longer match any installed package.
  const stale = [
    ...[...exemptByName.keys()].filter((n) => !exemptedNamesHit.has(n)),
    ...exemptPrefixes.filter((p) => !prefixHits.has(p)),
    ...Object.keys(overrides).filter((n) => !installedNames.has(n)),
  ];
  if (stale.length) {
    console.warn(
      `license-check: WARNING — ${stale.length} stale config entr(y/ies) no longer match any package (remove them): ${stale.join(', ')}`,
    );
  }

  if (violations.length === 0) {
    console.log('license-check: PASS — 0 license violations.');
    process.exit(0);
  }

  violations.sort((a, b) => a.lic.localeCompare(b.lic) || a.key.localeCompare(b.key));
  console.error(
    `\nlicense-check: FAIL — ${violations.length} package(s) with a disallowed or unresolved license:\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.lic.padEnd(26)} ${v.key}${v.repo ? `  ${v.repo}` : ''}`);
  }
  console.error(
    '\nResolve each:\n' +
      '  (a) license is fine        -> add the SPDX id to allowedSpdx\n' +
      '  (b) dependency we accept    -> add its exact name to exemptions (with reason + parents + reviewDate)\n' +
      '  (c) removable               -> remove the dependency\n' +
      'Config: .supply-chain/license-allowlist.json\n',
  );
  process.exit(1);
});
