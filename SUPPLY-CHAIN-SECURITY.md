# Supply Chain Security

This document describes how the `autonolas-frontend-mono` Nx monorepo protects itself against npm supply chain attacks — specifically, the scenario where a dependency (direct or transitive) is compromised and a malicious version is published.

It complements [`SECURITY.md`](./SECURITY.md), which covers reporting vulnerabilities in our own code.

## Threat model

The attacks we care about:

1. **Malicious publish** — a maintainer account is compromised (or a maintainer goes rogue) and a bad version of a legitimate package is published. Recent examples: `ua-parser-js` (2021), `node-ipc` protestware (2022), various `@ctrl/*` / `rspack`-related worms (2024–2025), the `shai-hulud` npm worm (2025).
2. **Typosquatting / dependency confusion** — a look-alike name is installed instead of the intended package. Especially relevant for an Nx workspace with many internal `@autonolas-frontend-mono/*` packages — an attacker could publish a same-named package on the public registry.
3. **Postinstall script abuse** — a compromised package runs arbitrary code during `yarn install`, exfiltrating env vars or tokens from the build environment. High-impact here because this is a Web3 app — a malicious postinstall could target wallet-connector / signing code.
4. **Transitive compromise** — a deep, rarely-audited dependency is the attack vector. The Solana + Ethereum + wagmi stack pulls in a very large transitive tree.

## Policies

### 1. Exact version pinning in all `package.json` files

All direct dependencies are pinned to **exact versions** — no `^`, no `~`, no `>=`, no floating major. This applies to:

- Root [`package.json`](./package.json).
- Every library in [`libs/*/package.json`](./libs/).
- App-level deps (apps under `apps/*` inherit root deps via Nx; if any grow their own `package.json` with deps, they must follow the same rule).

**Why:** `^` allows minor and patch updates; `~` allows patch updates. If a compromised patch is published and someone runs `yarn add <other-pkg>` or `yarn install` without a lockfile, the bad version can enter the tree silently. Exact pins make every version change an explicit, reviewable `package.json` diff.

**How to update a dependency:** bump the exact version in `package.json`, run `yarn install`, review the `yarn.lock` diff, and commit both files in the same PR. Never run `yarn upgrade` without pinning the result.

### 2. Lockfile is the source of truth

- [`yarn.lock`](./yarn.lock) is committed and required.
- CI installs use `yarn install --frozen-lockfile` (or `--immutable` on Yarn Berry). This fails the build if `package.json` and `yarn.lock` disagree, preventing silent resolution drift.
- Each app's deployment (Vercel, etc.) must also use frozen installs.

### 3. Dependency-confusion protection for internal packages

Our internal packages live under the `@autonolas-frontend-mono/*` scope. To prevent dependency confusion (attacker publishes a malicious `@autonolas-frontend-mono/util-functions` to the public registry):

- **Reserve the scope on npm** even if we never publish — register `@autonolas-frontend-mono` to the organization so no one else can publish to it. Alternatively, rename the scope to one that *is* registered and controlled (e.g. `@valory-xyz/*`).
- Document any `.npmrc` / `.yarnrc` registry overrides.
- In CI, consider `--strict-dependency-confusion` equivalents (or Socket/Snyk-style scanners).

### 4. Lockfile review in PRs

Any PR that touches `yarn.lock` requires a reviewer to confirm:

- The diff is proportionate to the `package.json` change (adding one dep shouldn't balloon the lockfile by thousands of lines unless it's a heavy package like a Solana SDK).
- No unexpected packages appear. Look for unfamiliar names, typos of known packages, or packages with very recent publish dates on high-traffic names.
- Resolved URLs point to the official registry (`registry.yarnpkg.com` / `registry.npmjs.org`), not a fork or mirror.

### 5. Cooldown window on updates

Prefer dependency versions that are **at least 7 days old**. Most malicious publishes are caught and unpublished within hours to days.

For Renovate, use `minimumReleaseAge: "7 days"` in `renovate.json`. Dependabot does not natively support cooldown windows.

### 6. Audit in CI

Run `yarn audit --level high` on every PR. Given the size of this tree (Web3 + Storybook + Cypress + Solana + Ethereum), expect noise — maintain an allowlist of acknowledged low-severity items but never allowlist high/critical without an explicit, dated exception.

### 7. Avoid postinstall-heavy dependencies

When adding a new dependency, check:

- Does it have a `postinstall` / `preinstall` / `install` script? (`yarn why <pkg>` + inspect its `package.json`)
- If yes, is the script necessary, and is the package well-known?
- Prefer alternatives with no install scripts for new additions.

**Web3-specific watch:** wallet connector libraries (`@web3modal/*`, `@solana/wallet-adapter-*`, `wagmi`, `viem`) and their transitive deps sign transactions on behalf of users in downstream Pearl/operate apps. A compromised version could alter addresses or drain funds. Scrutinize any bump.

### 8. Secrets hygiene in the build environment

- No long-lived secrets in CI env vars that a postinstall script could exfiltrate.
- GitHub Actions secrets should be scoped per-workflow; avoid the `pull_request_target` trigger on PRs from forks.
- Each app's build env vars in Vercel should be scoped to what that app needs — no deploy keys, no cloud provider credentials.
- `.npmrc` / `.yarnrc` auth tokens: never committed.

### 9. Dependency review on every new addition

Before adding a new direct dependency:

- Weekly download count on npm — very low numbers on a "popular-sounding" name is a typosquat red flag.
- GitHub repo exists, is active, has reasonable star count and contributor history.
- Maintainer is the expected one (check publish history: `npm view <pkg> time`).
- No recently transferred ownership unless it's a known, announced transfer.
- For wallet/signing/crypto libraries, additionally confirm the audit status on the project's site.

## Response playbook: "a dependency we use was just disclosed as compromised"

1. **Identify exposure.** `yarn why <pkg>` — direct or transitive? Which version is in our lockfile? Which apps ship it?
2. **Check the window.** When was the bad version published vs. when each app was last deployed? A Pearl-operate build from before the publish is safe in production, but any fresh `yarn install` would pull the bad one.
3. **Pin to a safe version.** Edit `package.json` to a known-good version (or add a Yarn `resolutions` entry for transitive deps — the repo already uses resolutions, see root `package.json`). Commit lockfile.
4. **Rotate secrets.** If the bad version ran on any CI job or dev machine since it was published, rotate anything it could have seen: npm tokens, Vercel deploy tokens, GitHub tokens, any `NEXT_PUBLIC_*` keys that are sensitive, CMS API keys, wallet-related secrets.
5. **Redeploy every affected app.** `yarn nx build` for each app and redeploy. This is especially important if the compromised package touched wallet/signing paths.
6. **Post-mortem.** Record the incident: what package, which version, how we detected it, time-to-mitigate, what leaked (if anything). Update this document if a new class of attack needs a new policy.

## Current gaps / TODO

- [x] Pin all direct dependencies in `package.json` (root) to exact versions.
- [x] Pin deps in `libs/*/package.json` to exact versions.
- [ ] Register / reserve the `@autonolas-frontend-mono` scope on npm, or rename to a scope we control.
- [ ] Add `yarn audit` to CI (GitHub Actions) — wire into existing `.github/workflows`.
- [ ] Evaluate Renovate with `minimumReleaseAge: "7 days"` to replace / supplement Dependabot.
- [ ] Document which Vercel env vars are build-time vs runtime per app and scope accordingly.
- [ ] Verify every app's deployment uses `--frozen-lockfile`.
- [ ] Consider Socket.dev or Snyk integration for postinstall-script detection on the large Web3 dep tree.

## References

- [npm supply chain attacks — OWASP overview](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
- [GitHub advisory database](https://github.com/advisories)
- [Socket.dev](https://socket.dev/) — supply chain scanner with postinstall script detection
- [Shai-Hulud npm worm writeup (2025)](https://socket.dev/blog/shai-hulud-worm) — representative of modern npm worm class
- [Dependency confusion — Alex Birsan's original writeup](https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610)
