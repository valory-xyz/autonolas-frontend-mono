# Contributing to Autonolas Frontend Mono

Thank you for your interest in contributing. This document gives guidelines for contributing to this repository. For app-specific notes, see `contribute.md` in each app folder.

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
docs: update contribute.md with testing guidelines
```

### Before submitting

1. Run the affected app: `yarn nx run <app-name>:serve`
2. Lint: `yarn nx lint <app-name> --fix`
3. Test: `yarn nx test <app-name>`
4. Rebase on the base branch and ensure CI passes.

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
- **Security**: See [SECURITY.md](https://github.com/valory-xyz/autonolas-frontend-mono/security/policy)

## License

Contributions are licensed under the MIT License.
