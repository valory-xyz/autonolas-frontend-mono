# Supply Chain Security

This document describes how the `autonolas-frontend-mono` Nx monorepo protects itself against npm supply chain attacks — specifically, the scenario where a dependency (direct or transitive) is compromised and a malicious version is published.

It complements [`SECURITY.md`](./SECURITY.md), which covers reporting vulnerabilities in our own code.

## Threat model

The attacks we care about:

1. **Malicious publish** — a maintainer account is compromised (or a maintainer goes rogue) and a bad version of a legitimate package is published. Recent examples: `ua-parser-js` (2021), `node-ipc` protestware (2022), various `@ctrl/*` / `rspack`-related worms (2024–2025), the `shai-hulud` npm worm (2025).
2. **Typosquatting / dependency confusion** — a look-alike name is installed instead of the intended package. Especially relevant for an Nx workspace with many internal `@autonolas-frontend-mono/*` packages — an attacker could publish a same-named package on the public registry.
3. **Postinstall script abuse** — a compromised package runs arbitrary code during `yarn install`, exfiltrating env vars or tokens from the build environment. High-impact here because the workspace ships Web3 apps (Bond, Govern, Launch, Operate, Marketplace, etc.) and a malicious postinstall could target wallet-connector / signing code paths or drain per-app Vercel secrets.
4. **Transitive compromise** — a deep, rarely-audited dependency is the attack vector. The Solana + Ethereum + wagmi + IPFS + Storybook + Cypress stack pulls in a very large transitive tree.

## Policies

### 1. Exact version pinning in all `package.json` files

All direct dependencies are pinned to **exact versions** — no `^`, no `~`, no `>=`, no floating major. This applies to:

- Root [`package.json`](./package.json).
- Every library under [`libs/*/package.json`](./libs/).
- App-level deps (apps under `apps/*` inherit root deps via Nx; if any grow their own `package.json` with deps, they must follow the same rule).

**Why:** `^` allows minor and patch updates; `~` allows patch updates. If a compromised patch is published and someone runs `yarn add <other-pkg>` or `yarn install` without a lockfile, the bad version can enter the tree silently. Exact pins make every version change an explicit, reviewable `package.json` diff.

**How to update a dependency:** bump the exact version in `package.json`, run `yarn install`, review the `yarn.lock` diff, and commit both files in the same PR. Never run `yarn upgrade` without pinning the result.

**Transitive overrides follow the same rule.** Entries under `"resolutions"` in root [`package.json`](./package.json) are a transitive-pinning mechanism, not an escape hatch for ranges. Use `"1.2.3"`, not `"^1.2.3"` or `">=1.2.3"`, so a compromised patch cannot silently enter the tree through an override. When adding a resolution to clear a CVE, reference the advisory in the PR/commit message so future readers understand why the override exists.

### 2. Single lockfile, treated as source of truth

[`yarn.lock`](./yarn.lock) is the canonical lockfile. The `packageManager` field in [`package.json`](./package.json) pins Yarn `1.22.22`; the Supply Chain CI job ([.github/workflows/supply-chain.yml](./.github/workflows/supply-chain.yml)) activates that version explicitly via `corepack enable` + `corepack prepare yarn@1.22.22 --activate` at the start of every Node job, so installs don't fall back to whatever Yarn the runner happens to ship with. `package-lock.json` / `pnpm-lock.yaml` are in [`.gitignore`](./.gitignore) so a stray `npm install` / `pnpm install` can't land a second lockfile that conflicts with `yarn.lock`. CI and Vercel both install with `yarn install --frozen-lockfile`, which fails if `package.json` and `yarn.lock` disagree — catching any silent resolution drift at build time.

### 3. Dependency-confusion protection for internal packages

Our internal packages live under the `@autonolas-frontend-mono/*` scope. To prevent dependency confusion (an attacker publishes a malicious `@autonolas-frontend-mono/util-functions` to the public registry):

- **Reserve the scope on npm** even if we never publish — register `@autonolas-frontend-mono` to the organization so no one else can publish to it. Alternatively, rename the scope to one we already control (e.g. `@valory-xyz/*`).
- Document any `.npmrc` / `.yarnrc` registry overrides (currently none — if one is ever added, it must pin the registry to `https://registry.npmjs.org/` or an equivalent trusted mirror).

### 4. Lockfile review in PRs

Any PR that touches `yarn.lock` requires a reviewer to confirm:

- The diff is proportionate to the `package.json` change (adding one dep shouldn't balloon the lockfile by thousands of lines unless it's a heavy package like a Solana SDK).
- No unexpected packages appear. Look for unfamiliar names, typos of known packages, or packages with very recent publish dates on high-traffic names.
- Resolved URLs point to the official registry (`registry.yarnpkg.com` / `registry.npmjs.org`), not a fork or mirror. This is also enforced automatically by the `lockfile-lint` job — see [§6](#6-audit-in-ci).

### 5. Cooldown window on updates

Prefer dependency versions that are **at least 7 days old**. Most malicious publishes are caught and unpublished within hours to days.

This is enforced by **manual discipline on every PR**. When a PR bumps a dependency, the reviewer checks `npm view <pkg> time` (or the npm page) and confirms the target version is at least 7 days old. If the bump is for a disclosed security advisory, the cooldown does not apply — note the advisory ID in the PR description so the override is auditable.

Vulnerability discovery does not depend on this rule. Already-disclosed CVEs are caught by the `yarn audit:prod` job in [.github/workflows/supply-chain.yml](./.github/workflows/supply-chain.yml) on every PR (see [§6](#6-audit-in-ci)), and GitHub sends passive Dependabot alerts (Security tab / email) for advisories affecting our lockfile regardless of any repo configuration.

**Known gap:** the GitHub Actions in the app workflows + [`.github/workflows/supply-chain.yml`](./.github/workflows/supply-chain.yml) and [`.github/workflows/snyk-security.yml`](./.github/workflows/snyk-security.yml) are SHA-pinned, but [`.github/workflows/gitleaks.yml`](./.github/workflows/gitleaks.yml) still uses floating `@v3` tags. Audit SHA pins periodically — at minimum once per major release of each action.

### 6. Audit in CI

Three jobs in [.github/workflows/supply-chain.yml](./.github/workflows/supply-chain.yml) run on every PR and push to `main` / `staging`:

- **`yarn audit` (production tree, blocking on high/critical)** — delegates to [`scripts/audit.mjs`](./scripts/audit.mjs), which runs `yarn audit --groups dependencies --json` and gates on its own logic instead of Yarn 1.x's bitmask exit code. `--groups dependencies` restricts to the production tree — `devDependencies` (ESLint / Babel / TypeScript / Storybook / Cypress / types) generate substantial transitive-advisory noise and do not ship to users. An unlisted high/critical advisory against a production dependency blocks merge; the PR author must either (a) bump the dep, (b) add an exact-pinned Yarn `resolutions` entry per [§1](#1-exact-version-pinning-in-all-packagejson-files) with the advisory ID in the PR description, or (c) add the advisory to [`.supply-chain/audit-allowlist.json`](./.supply-chain/audit-allowlist.json) with a reason and review date. Allowlist entries whose `review` date has passed generate a `::warning::` in CI output (surfaced in the Actions UI) but do not fail the job — the warning is how the team is kept honest about re-evaluating suppressions.
- **`lockfile-lint`** — runs [`lockfile-lint`](https://github.com/lirantal/lockfile-lint) to enforce that every `resolved` URL in `yarn.lock` points at `registry.yarnpkg.com` or `registry.npmjs.org`, uses HTTPS, and has an integrity hash — automating the registry-origin part of [§4](#4-lockfile-review-in-prs). The tool is pinned as a `devDependency` in [`package.json`](./package.json) (currently `5.0.0`) and invoked via the `yarn lint:lockfile` script, so the `lockfile-lint` binary used in CI is integrity-verified against `yarn.lock` rather than re-fetched on every run.
- **`install-hook audit`** — runs [`scripts/audit-install-hooks.mjs`](./scripts/audit-install-hooks.mjs) to enumerate every package in `node_modules` with a non-trivial `preinstall` / `install` / `postinstall` script, and diffs that set against [`.supply-chain/install-hooks.allowlist`](./.supply-chain/install-hooks.allowlist). A new name in the tree not in the allowlist — or a stale allowlist entry not in the tree — fails the job. This turns the "a new package with a postinstall just entered my dep graph" scenario into an explicit allowlist diff that a reviewer has to sign off on, rather than a silent change buried in `yarn.lock`. See [§7](#7-avoid-postinstall-heavy-dependencies).

All three jobs run in addition to [`.github/workflows/snyk-security.yml`](./.github/workflows/snyk-security.yml), which provides Snyk SAST (code analysis) and Snyk Open Source (SCA) monitoring. Snyk runs non-blocking (`continue-on-error: true`) and uploads results to GitHub Code Scanning; the blocking supply-chain gates are `yarn audit:prod` + `yarn lint:lockfile` + `yarn audit:install-hooks`.

The CI step deliberately runs `yarn audit:prod`, not `yarn audit`. Yarn 1.x ships a built-in `yarn audit` subcommand that takes priority over a same-named entry in `package.json` `scripts`, so naming the wrapper `audit` would silently bypass [`scripts/audit.mjs`](./scripts/audit.mjs) and run the stock command instead — skipping the allowlist and the production-tree filter. The `audit:prod` name makes the collision impossible and lines up with the sibling `audit:install-hooks` / `audit:install-hooks:update` / `lint:lockfile` scripts.

**Why a wrapper and not stock `yarn audit`.** Yarn 1.x `yarn audit` exits with a severity bitmask (`1`=info, `2`=low, `4`=moderate, `8`=high, `16`=critical) rather than a threshold comparison — `--level high` filters the *printed* output but does not affect the exit code. On top of that, there is no native way to suppress a specific advisory that cannot be fixed (e.g. abandoned upstream, deferred major migration). [`scripts/audit.mjs`](./scripts/audit.mjs) handles both: it parses the JSON output, applies the high/critical gate explicitly, and consults the allowlist. Revisit on a future Yarn Berry migration, which ships `yarn npm audit` with proper severity gating.

### 7. Avoid postinstall-heavy dependencies

When adding a new dependency, check:

- Does it have a `postinstall` / `preinstall` / `install` script? (`yarn why <pkg>` + inspect its `package.json`)
- If yes, is the script necessary, and is the package well-known?
- Prefer alternatives with no install scripts for new additions.

**Cautionary case — `ipfs@0.63.5` (removed).** `ipfs` (the archived `js-ipfs` package; Helia is its successor) was a direct dependency with no direct imports in application code — only `ipfs-http-client` was actually used. The transitive chain `ipfs → ipfs-cli → ipfs-daemon → electron-webrtc → electron-eval → headless` pulled in `electron@1.8.8` (a 2018-era Chromium with a `node install.js` postinstall that downloads a binary on every `yarn install`) and `wrtc@0.4.7` (ditto, via `node scripts/download-prebuilt.js`), plus `headless` from a GitHub tarball with no integrity hash — which by itself made `lockfile-lint` fail CI. A single-line removal from root [`package.json`](./package.json) cleared the `lockfile-lint` failure and two unnecessary postinstall binary-download steps. (The surviving `form-data@~2.3.2` entries in [`yarn.lock`](./yarn.lock) reach the tree independently — via `web3 → web3-bzz → swarm-js → eth-lib → servify → request → form-data` in the prod tree and `cypress → @cypress/request → form-data` in devDependencies — and are tracked as a separate line item in the TODO list below: `form-data < 2.5.5` / `< 3.0.4` / `< 4.0.4` is affected by CVE-2024-42459, so `2.3.3` is itself vulnerable, not a fix.) The lesson: a direct dep that is not imported anywhere is pure liability, and the postinstall blast radius of an archived package chain can be substantially worse than the package's stated purpose suggests. Before accepting a dep, `yarn why <new-pkg>` and grep for actual imports.

**Live install-hook surface.** As of this writing, the production tree carries these non-trivial install hooks (enumerated by walking `node_modules` for `scripts.{pre,post,}install` that aren't pure `echo`):

| Package | Hook | Notes |
| --- | --- | --- |
| `secp256k1`, `keccak`, `blake-hash`, `utf-8-validate`, `bufferutil`, `bigint-buffer`, `tiny-secp256k1`, `usb` | `node-gyp-build` | Native crypto / wallet-signing bindings and Trezor USB transport (`usb` reaches the tree via `@solana/wallet-adapter-wallets → @solana/wallet-adapter-trezor → @trezor/connect-web → @trezor/connect → @trezor/transport → usb`); legitimate. Each fallback-compiles to pure JS, so `--ignore-scripts` degrades gracefully. |
| `protobufjs` | `node scripts/postinstall` | Resolves CLI shims; benign. |
| `es5-ext` | `node -e "try{require('./_postinstall')}catch(e){}"` | Package behind the March 2024 protestware incident. Currently benign but single-maintainer — treat any `es5-ext` bump on its own merits. |
| `web3`, `web3-bzz`, `web3-shh` | `echo` only | Harmless. |
| `@swc/core` | `node postinstall.js` | Dev-only (not in production tree). |

A new package entering the tree with an install script is caught automatically by the **install-hook audit job** in [.github/workflows/supply-chain.yml](./.github/workflows/supply-chain.yml). The job runs [`scripts/audit-install-hooks.mjs`](./scripts/audit-install-hooks.mjs) and diffs the set of packages declaring non-trivial `preinstall` / `install` / `postinstall` hooks against the checked-in allowlist at [`.supply-chain/install-hooks.allowlist`](./.supply-chain/install-hooks.allowlist). Any new name in the tree fails CI until the PR author explicitly updates the allowlist — at which point the allowlist diff becomes the reviewer's signal. Run `yarn audit:install-hooks:update` locally after any dependency change and commit the regenerated allowlist with the `package.json` / `yarn.lock` diff.

The script filters out trivial hooks (`echo`, `true`, `:`, `exit 0`). Everything else counts, including wrapped `try/catch` shims like `es5-ext`'s postinstall — the point is to keep the surface explicit, not to triage "how scary" each hook is.

**Web3 / monorepo-specific watches:**

- [`wagmi`](https://www.npmjs.com/package/wagmi), [`viem`](https://www.npmjs.com/package/viem), [`@wagmi/core`](https://www.npmjs.com/package/@wagmi/core), [`@web3modal/*`](https://www.npmjs.com/package/@web3modal/wagmi), [`@web3auth/modal`](https://www.npmjs.com/package/@web3auth/modal), [`@binance/w3w-wagmi-connector-v2`](https://www.npmjs.com/package/@binance/w3w-wagmi-connector-v2) — wallet connector / EVM signing libraries. Scrutinize any bump: a compromised version could alter addresses or drain funds in downstream Pearl / Operate / Bond / Launch apps.
- [`@solana/web3.js`](https://www.npmjs.com/package/@solana/web3.js), [`@solana/wallet-adapter-*`](https://www.npmjs.com/package/@solana/wallet-adapter-react), [`@coral-xyz/anchor`](https://www.npmjs.com/package/@coral-xyz/anchor), [`@orca-so/whirlpools-sdk`](https://www.npmjs.com/package/@orca-so/whirlpools-sdk), [`@project-serum/anchor`](https://www.npmjs.com/package/@project-serum/anchor) — Solana signing stack.
- [`ethers`](https://www.npmjs.com/package/ethers) (v6, primary) + [`ethers-v5`](./package.json) (v5, aliased). Two parallel ethers versions both sign on behalf of users; audit both on any bump.
- [`web3`](https://www.npmjs.com/package/web3) — large transitive tree; the web3 ecosystem has historically been a high-value target.
- [`@safe-global/protocol-kit`](https://www.npmjs.com/package/@safe-global/protocol-kit), [`@gnosis.pm/safe-contracts`](https://www.npmjs.com/package/@gnosis.pm/safe-contracts) — Safe multisig interactions.
- [`@vercel/blob`](https://www.npmjs.com/package/@vercel/blob) / [`@takumi-rs/*`](https://www.npmjs.com/package/@takumi-rs/image-response) — OG image generation path that reads Vercel runtime secrets in any app that uses it.

### 8. Secrets hygiene in the build environment

This is a multi-app monorepo: each deployed app (Bond, Build, Contribute, Docs, Govern, Launch, Marketplace, Operate, Pearl API) has its own Vercel project and its own set of environment variables (RPC URLs, subgraph URLs, API keys, Wallet Project ID, Etherscan keys, etc.) — see each app's `.env.example` for the exact list. There is no single centralized secrets surface, which is good for blast-radius isolation but makes per-app audit the auditor's responsibility.

General hygiene:

- **No long-lived secrets in CI env vars that a postinstall script could exfiltrate.** The app-level workflows in [.github/workflows/](./.github/workflows/) do not export repo or org secrets to the install step. [`.github/workflows/snyk-security.yml`](./.github/workflows/snyk-security.yml) uses `SNYK_TOKEN`, and as of the supply-chain hardening in this doc, the token is scoped **per-step** to the Snyk steps only — it is not set at the job level and is therefore not present in the environment during `yarn install --frozen-lockfile`. If a new job needs a secret, follow the same pattern: declare `env:` on the step that uses the secret, never on the job.
- **`pull_request_target`** must not be used on PRs from forks (it exposes repo secrets to fork-controlled code). None of the current workflows use it.
- **Per-app Vercel env vars:** anything only the running server needs (RPC URLs with keyed Alchemy/Infura endpoints, CMS API keys, `DUNE_API_KEY`-style metric-aggregator keys, Vercel Blob tokens, Etherscan API keys) must be marked **runtime-only** in the Vercel project settings so it is not present when `yarn install` runs. Build-time exposure is exactly what a compromised `postinstall` script exfiltrates. Audit each app's Vercel project periodically to confirm scoping.
- **`NEXT_PUBLIC_*` variables** (subgraph URLs, Wallet Project ID, CMS URL, etc.) are inlined into the client bundle by Next.js and are visible to anyone who loads the site. Treat them as public configuration.
- **RPC URLs are effectively secrets.** They typically embed an API key in the URL, and a compromised value can be used to drain our quota or impersonate reads from us. Do not mark an RPC URL `NEXT_PUBLIC_*` unless the endpoint is genuinely unkeyed.
- **Vercel deploy tokens, GitHub tokens, and cloud-provider credentials** must never be available to the build environment of any app.
- **`.npmrc` / `.yarnrc` auth tokens:** never committed. [`.gitignore`](./.gitignore) currently protects `.env`, `.env.local`, and `.env*.local` via the catch-all entry.

### 9. Dependency review on every new addition

Before adding a new direct dependency:

- Weekly download count on npm — very low numbers on a "popular-sounding" name is a typosquat red flag.
- GitHub repo exists, is active, has reasonable star count and contributor history.
- Maintainer is the expected one (check publish history: `npm view <pkg> time`).
- No recently transferred ownership unless it's a known, announced transfer.
- For wallet / signing / crypto libraries, additionally confirm the audit status on the project's site and check Socket.dev / Snyk advisories.

## Response playbook: "a dependency we use was just disclosed as compromised"

1. **Identify exposure.** `yarn why <pkg>` — direct or transitive? Which version is in our lockfile? Which apps ship it? (Use `yarn nx graph` or `yarn nx show project <app>` to map dep → deployed app.)
2. **Check the window.** When was the bad version published vs. when each app was last deployed? An app last built from before the publish is safe in production, but any fresh `yarn install` would pull the bad one.
3. **Pin to a safe version.** Edit `package.json` to a known-good version (or add a Yarn `resolutions` entry for transitive deps, following the exact-pinning rule in [§1](#1-exact-version-pinning-in-all-packagejson-files) — the repo already uses `resolutions`). Commit lockfile.
4. **Rotate secrets per affected app.** If the bad version ran on any CI job or dev machine since it was published, rotate anything it could have seen: npm tokens, Vercel deploy tokens, GitHub tokens, the `SNYK_TOKEN`, and — for every affected app — its RPC URLs, CMS keys, subgraph API keys, wallet-related secrets, and any `NEXT_PUBLIC_*` keys that are actually sensitive. Because each app has its own Vercel project, scope the rotation to the apps whose builds or runtime actually imported the compromised package.
5. **Redeploy every affected app.** `yarn nx build <app>` + Vercel redeploy for each one. This is especially important if the compromised package touched wallet / signing paths.
6. **Post-mortem.** Record the incident: what package, which version, how we detected it, time-to-mitigate, what leaked (if anything). Update this document if a new class of attack needs a new policy.

## Current gaps / TODO

- [x] Pin all direct dependencies in [`package.json`](./package.json) (root) to exact versions.
- [x] Pin deps in [`libs/*/package.json`](./libs/) to exact versions.
- [x] Add a `packageManager` field to [`package.json`](./package.json) pinning `yarn@1.22.22`.
- [x] Add `package-lock.json` / `pnpm-lock.yaml` to [`.gitignore`](./.gitignore) to prevent stray dual-lockfile creation.
- [x] Add `yarn audit:prod` (wraps `yarn audit --groups dependencies --json` via [`scripts/audit.mjs`](./scripts/audit.mjs), **blocking on unlisted high/critical**, consults [`.supply-chain/audit-allowlist.json`](./.supply-chain/audit-allowlist.json)) and `yarn lint:lockfile` to CI — see [.github/workflows/supply-chain.yml](./.github/workflows/supply-chain.yml).
- [x] Update every app workflow ([.github/workflows/build.yml](./.github/workflows/build.yml), [contribute.yml](./.github/workflows/contribute.yml), [govern.yml](./.github/workflows/govern.yml), [launch.yml](./.github/workflows/launch.yml), [marketplace.yml](./.github/workflows/marketplace.yml), [operate.yml](./.github/workflows/operate.yml)) to install with `yarn install --frozen-lockfile` instead of bare `yarn`.
- [x] Remove unused `ipfs` direct dep from root [`package.json`](./package.json) (kills the `electron@1.8.8` + `wrtc` + `headless`-from-tarball transitive chain, unblocks `lockfile-lint`, clears `form-data` < 2.3.3 CVE).
- [x] Bump direct deps with known CVEs: `axios` `1.2.1` → `1.7.7` (CVE-2023-45857, CVE-2024-39338), `node-fetch` `2.0.0` → `2.7.0` (CVE-2020-15168, CVE-2022-0235).
- [x] Normalize `.github/workflows/marketplace.yml` from `actions/setup-node@v3` to `@v4` (the lone version outlier).
- [x] Scope `SNYK_TOKEN` to Snyk steps only in [`.github/workflows/snyk-security.yml`](./.github/workflows/snyk-security.yml) (removes postinstall-exfil window).
- [x] Pin transitive `axios@^0.24.x` reached via `@balancer-labs/sdk` to `1.7.7` with a Yarn `resolutions` entry (`"@balancer-labs/sdk/axios": "1.7.7"`). Clears CVE-2023-45857 / CVE-2024-39338 for the production tree. The remaining `axios@^0.21.x` / `axios@1.6.8` transitive entries are reached only through `cypress` and `nx` (devDependencies) and are out of scope for `yarn audit --groups dependencies`.
- [x] Pin transitive `form-data` to `2.5.5` via a top-level Yarn `resolutions` entry (`"form-data": "2.5.5"`). Clears CVE-2024-42459 (affects `< 2.5.5` / `< 3.0.4` / `< 4.0.4`). Path-scoped resolutions (`"request/form-data"`, `"@cypress/request/form-data"`) were tried first but Yarn 1.x's `parent/child` resolution only hits when the parent is close to the root, which `request` isn't (it reaches the tree through six transitive hops via `web3 → web3-bzz → swarm-js → eth-lib → servify`). All `form-data` consumers — `axios`, `jsdom`, `cypress`, `@balancer-labs/sdk#graphql-request`, `nx`, `web3`, `@binance/w3w-*`, `@web3inbox/core`, etc. — now collapse to `form-data@2.5.5`. API is compatible across `form-data` `2.x` / `3.x` / `4.x`, so downgrading the `^3`/`^4` consumers to `2.5.5` is safe in practice. Yarn warns `"Resolution field \"form-data@2.5.5\" is incompatible with requested version \"form-data@^4.0.0\""` on install — that warning is expected and is just Yarn announcing the intentional override.
- [x] **Full `yarn audit` sweep.** Starting point was 137 unique advisories (6 critical, 69 high) — the stock CI gate would have blocked every PR. Cleared by bumping direct `axios` `1.7.7` → `1.13.5`, `lodash` `4.17.21` → `4.18.1`, and adding Yarn `resolutions` for ~28 transitive packages (`cipher-base`, `elliptic`, `pbkdf2`, `protobufjs`, `sha.js`, `@remix-run/router`, `@xmldom/xmldom`, `body-parser`, `braces`, `cross-spawn`, `defu`, `h3`, `immutable`, `lodash-es`, `node-fetch`, `node-forge`, `parse-duration`, `path-to-regexp`, `picomatch`, `serialize-javascript`, `socket.io-parser`, `svgo`, `tar`, `tiny-secp256k1`, `base-x`, `minimatch`, `secp256k1`, `undici`, `ws`). After the sweep: 0 critical, 3 high — all 3 allowlisted in [`.supply-chain/audit-allowlist.json`](./.supply-chain/audit-allowlist.json) with reasons and 3-month review dates.

  **Notes on two resolution decisions:**

  - `minimatch` is pinned to `5.1.8`, not `9.0.7` as the advisory recommends. Forcing 9.x globally broke `nx build` at runtime (`TypeError: minimatch is not a function`) — minimatch 9.x removed the callable default export that `nx` / `@nx/workspace` depend on. `5.1.8` is the latest version in the 5.x line, covers CVE-2026-26996 / CVE-2026-27903 / CVE-2026-27904 (which affect `<5.1.8` in the 5.x range), preserves the callable-function API, and lets 3.x and 9.x consumers collapse to a single compatible version via the global resolution.
  - No resolution for `glob`. The only `glob` high-severity advisory flagged `glob >=10.2.0 <10.5.0`, and this tree has no 10.x consumers — only 7.x and 9.x, neither of which is affected. Forcing `glob@10.5.0` was cargo-culted from the advisory text and broke `nx` in an earlier iteration for the same reason as `minimatch@9` (API changed). Removed.
- [x] Add [`scripts/audit.mjs`](./scripts/audit.mjs) as the supply-chain CI's audit step — wraps `yarn audit --groups dependencies --json`, applies the high/critical gate explicitly, and consults the allowlist. Replaces the stock `yarn audit` invocation so the gate can be merged with 3 unfixable advisories suppressed rather than becoming a permanent red X.
- [x] Commit [`scripts/audit-install-hooks.mjs`](./scripts/audit-install-hooks.mjs) + [`.supply-chain/install-hooks.allowlist`](./.supply-chain/install-hooks.allowlist) and wire the `install-hook audit` job into [`.github/workflows/supply-chain.yml`](./.github/workflows/supply-chain.yml). A new package with a `preinstall` / `install` / `postinstall` script now fails CI until explicitly allowlisted.
- [x] SHA-pin `actions/checkout`, `actions/setup-node`, and `actions/cache` in all six app workflows (`build`, `contribute`, `govern`, `launch`, `marketplace`, `operate`) to match the pattern already used in [snyk-security.yml](./.github/workflows/snyk-security.yml) and [supply-chain.yml](./.github/workflows/supply-chain.yml). Audit the pins periodically — at minimum once per major release of each action — until a bot with `pinDigests: true` is in place.
- [ ] SHA-pin [.github/workflows/gitleaks.yml](./.github/workflows/gitleaks.yml) (currently `actions/checkout@v3` + `actions/setup-go@v3`) — same rationale as the app workflows above.
- [ ] **Next.js 14 → 15 migration** (dedicated PR, not supply-chain scope). Clears two currently-allowlisted high advisories: GHSA-h25m-26qc-wcjf (DoS via insecure RSC) and GHSA-q4gf-8mx6-v5v3 (DoS with Server Components). Both are RSC-path issues; our apps use classic Next pages and are not on the hot path, which is why it is safe to allowlist for the migration window. See `.supply-chain/audit-allowlist.json` entries 1112653 and 1116376 — next allowlist review is 2026-07-24.
- [ ] Track `bigint-buffer` upstream — currently allowlisted (advisory 1103747 / GHSA-3gc7-fjrx-p6mg) because `patched_versions: <0.0.0` means no fix exists. Reaches the tree via `@solana/wallet-adapter-wallets > @solana/wallet-adapter-torus > crypto-browserify` and `@solana/web3.js`. Either (a) upstream fork/replacement appears and we switch, or (b) we drop Solana support. Review on 2026-07-24.
- [ ] Register / reserve the `@autonolas-frontend-mono` scope on npm, or rename to a scope we already control.
- [ ] Audit Vercel env-var scoping per app — every secret (RPC URLs, subgraph keys, CMS keys, Blob tokens, Wallet Project ID if it is ever moved to non-public scope) must be marked **runtime-only** in each app's Vercel project. Build-time exposure is exactly what a compromised `postinstall` script exfiltrates.
- [ ] Verify every app's Vercel install command is `yarn install --frozen-lockfile` (either via a per-app `vercel.json` or the Vercel dashboard).

## References

- [GitHub advisory database](https://github.com/advisories)
- [Socket.dev](https://socket.dev/) — supply chain scanner with postinstall script detection
- [Shai-Hulud Strikes Again (v2) — Socket, Nov 2025](https://socket.dev/blog/shai-hulud-strikes-again-v2) — representative of modern npm worm class (500+ packages, 700+ versions affected)
- [Dependency confusion — Alex Birsan's original writeup](https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610)
- [lockfile-lint](https://github.com/lirantal/lockfile-lint) — validates `resolved` URLs, HTTPS, and integrity hashes in `yarn.lock`
