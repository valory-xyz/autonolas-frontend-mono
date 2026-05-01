# Security Policy

This document covers vulnerability reporting for `autonolas-frontend-mono` — the Nx monorepo containing the Olas frontends (Bond, Build, Contribute, Docs, Govern, Launch, Marketplace, Operate, Pearl API).

For policies that protect this repo against npm supply chain attacks (compromised dependencies, install-script abuse, dependency confusion, etc.), see [SUPPLY-CHAIN-SECURITY.md](./SUPPLY-CHAIN-SECURITY.md).

## Scope

This policy covers:

- The application code in `apps/` and shared libraries in `libs/`.
- The build / deploy pipeline configured in `.github/workflows/`.
- The supply-chain controls documented in [SUPPLY-CHAIN-SECURITY.md](./SUPPLY-CHAIN-SECURITY.md).

Out of scope (report directly to the upstream maintainer):

- Vulnerabilities in third-party npm packages we depend on. Report to the package's own security contact; if disclosure affects us, follow up on this repo so we can pin / mitigate.
- Vulnerabilities in upstream services (Vercel, Snyk, GitHub Actions runners, RPC providers, IPFS gateways).
- Smart contract vulnerabilities — those live in the contract repos, not this frontend monorepo.

## Supported versions

Each app under `apps/` is deployed continuously from `main` to its respective Vercel project. Only the live `main` branch is supported with security fixes. There are no maintained release branches.

| Branch | Supported |
| ------ | --------- |
| `main` | ✅        |
| any other | ❌     |

## Reporting a vulnerability

Email **`info@valory.xyz`** with:

- A description of the vulnerability and the affected app(s) / library / workflow.
- Reproduction steps or a proof-of-concept.
- Your assessment of impact (read of user data, wallet drain, account takeover, supply-chain compromise, etc.) and any suggested remediation.

Please do **not** file a public GitHub issue or open a public PR for a non-public vulnerability.

GitHub's private vulnerability reporting (Security tab → "Report a vulnerability") is also accepted; use whichever channel is more convenient.

## Response process

We acknowledge receipt within **48 hours** and aim to send a substantive response within **5 business days** describing next steps. Following triage:

1. Confirm the vulnerability and identify which app(s) and which deployed builds are affected.
2. Audit related code paths for similar issues.
3. Develop a fix and verify it on staging (where applicable per app).
4. Coordinate disclosure timing with the reporter.
5. Deploy the fix to the affected Vercel projects.
6. Publish a brief post-mortem if the issue is significant.

For credentials / secrets exposure: we additionally rotate any tokens that may have been exposed (per-app Vercel env vars, RPC keys, Wallet Project ID, Etherscan keys, Vercel Blob tokens, `SNYK_TOKEN`, etc.) following the playbook in [SUPPLY-CHAIN-SECURITY.md](./SUPPLY-CHAIN-SECURITY.md#response-playbook-a-dependency-we-use-was-just-disclosed-as-compromised).

## Acknowledgement

We're grateful to security researchers who report responsibly. With your permission, we'll credit you in the post-mortem or release notes once the issue is resolved.

## Comments on this policy

Suggestions on how to improve this process are welcome — open a regular GitHub issue or PR for changes to the policy itself (it doesn't need to be private since it's the policy, not a vulnerability).
