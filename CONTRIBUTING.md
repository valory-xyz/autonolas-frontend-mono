# Contributing to Autonolas Frontend Mono

Thank you for your interest in contributing. This document gives guidelines for contributing to this repository. For app-specific notes, see `CONTRIBUTING.md` in each app folder.

## Getting started

1. Read the [README](README.md) for setup and development commands.
2. Check [Issues](https://github.com/valory-xyz/autonolas-frontend-mono/issues) for open work.
3. Look for issues labeled `good first issue` or `help wanted` if you're new.

## Workflow

### Branch naming (kebab-case)

- Features: `feature/your-feature-name`
- Bug fixes: `fix/issue-description`
- Chores: `chore/description`

### Commits and PR titles

We use **conventional commits**. Use them for both commit messages and **PR titles**.

**Types:** `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`

Reference: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types)

**Examples:**

```
feat: add network parameter to Meta component
fix: resolve staking contract navigation issue
docs: update CONTRIBUTING.md with testing guidelines
```

### Before submitting

1. Run the affected app: `yarn nx run <app-name>:serve`
2. Lint: `yarn nx lint <app-name> --fix`
3. Test: `yarn nx test <app-name>`
4. If your change touched [package.json](package.json), [yarn.lock](yarn.lock), or any file under [.github/workflows/](.github/workflows/) or [.supply-chain/](.supply-chain/), run the supply-chain gates: `yarn supply-chain`.
5. Rebase on the base branch and ensure CI passes.

## Adding or updating dependencies

This repo treats the dep tree as a security boundary — see [SUPPLY-CHAIN-SECURITY.md](SUPPLY-CHAIN-SECURITY.md) for the full policy. Quick rules for contributors:

- **Pin to exact versions.** Use `"1.2.3"`, never `"^1.2.3"` / `"~1.2.3"` / `">=1.2.3"` — in `dependencies`, `devDependencies`, and any `resolutions` entry. The `^`/`~` ranges let a compromised patch enter the tree silently; exact pins make every version change a reviewable diff.
- **Cooldown on bumps.** Prefer dep versions that are at least **7 days old** (most malicious publishes are caught within hours to days). Exception: bumps for a disclosed CVE — note the advisory ID in the PR description.
- **Review the new dep first** ([§9](SUPPLY-CHAIN-SECURITY.md#9-dependency-review-on-every-new-addition)): npm download count, GitHub repo activity, maintainer history (`npm view <pkg> time`). For wallet/signing/crypto libraries, additionally check the audit status on Socket.dev or Snyk.
- **If a new package brings a `pre/post/install` hook**, the install-hook audit job will fail until you add it to the allowlist. After `yarn install`:
  ```
  yarn audit:install-hooks:update
  git add .supply-chain/install-hooks.allowlist
  ```
  Commit the regenerated allowlist alongside `package.json` / `yarn.lock`.
- **Run `yarn supply-chain` locally** before pushing — it runs all three gates (`audit:prod`, `lint:lockfile`, `audit:install-hooks`) that block CI.
- **High/critical advisory in the production tree?** Either bump the dep, add an exact-pinned `resolutions` entry, or add the advisory to [.supply-chain/audit-allowlist.json](.supply-chain/audit-allowlist.json) with a reason and review date.

## Code quality

- **ESLint**: Follow the project ESLint config.
- **TypeScript**: Use TypeScript for new code where the app supports it.
- **Style**: Descriptive names, small focused functions, shared logic in `libs/` where appropriate.
- **Console**: Only `console.warn` and `console.error`; no `console.log` in production code.

## Testing

- Add or update tests for new behavior and bug fixes.
- Use Jest and existing test patterns in the repo.

## Help

- **Setup**: [README](README.md)
- **Issues**: Search or open an issue on GitHub
- **Security**: [SECURITY.md](SECURITY.md) for vulnerability reporting; [SUPPLY-CHAIN-SECURITY.md](SUPPLY-CHAIN-SECURITY.md) for the dep / install-hook / lockfile policy.

## License

Contributions are licensed under the MIT License.
