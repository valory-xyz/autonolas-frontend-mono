# Contributing to Autonolas Frontend Mono

Thank you for your interest in contributing! This document provides guidelines for contributing code to this repository.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Getting Help](#getting-help)

## Getting Started

Before contributing, please:

1. Review the [README](https://github.com/valory-xyz/autonolas-frontend-mono/blob/main/README.md) for setup instructions and development commands
2. Check the [Issues](https://github.com/valory-xyz/autonolas-frontend-mono/issues) page for open tasks
3. Look for issues labeled `good first issue` or `help wanted` if you're new to the project

## Development Workflow

### 1. Choose an Issue

- Find an issue you'd like to work on
- Comment on the issue to indicate you're working on it to avoid duplicate efforts
- If you're proposing a new feature, open an issue first to discuss it

### 2. Create a Branch

Follow the naming convention with kebab-case:

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-description

# For chores/maintenance
git checkout -b chore/description
```

### 3. Make Changes

- Write clear, focused commits
- Follow the code quality guidelines below
- Test your changes thoroughly
- Update documentation if your changes affect user-facing features or developer workflows

### 4. Test Your Changes

- Run the affected app locally: `npx nx serve [app-name]`
- Run tests: `npx nx test [app-name]`
- Run linting: `npx nx lint [app-name]`
- Ensure all checks pass before submitting

### 5. Submit a Pull Request

- Push your branch to GitHub
- Create a pull request with a clear description
- Reference any related issues
- Ensure all CI checks pass

## Code Quality

### TypeScript/JavaScript Standards

- **ESLint**: Follow the configured ESLint rules (Airbnb style guide + custom rules)
- **TypeScript**: Use TypeScript for all new code when possible

### Code Style Guidelines

- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused
- Use TypeScript interfaces/types for data structures
- Follow existing patterns in the codebase
- Avoid code duplication - extract shared logic to libraries

### File Organization

- Place shared components in appropriate `libs/` directories
- Keep app-specific code within the respective app's directory
- Follow the Nx conventions for project structure

## Testing

- Write tests for new features and bug fixes
- Use Jest for unit and integration tests
- Follow existing test patterns in the codebase
- Aim for meaningful test coverage, not just high percentages

## Pull Request Process

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

**Examples:**
```
feat(marketplace): add network parameter to Meta component
fix(launch): resolve staking contract navigation issue
docs: update CONTRIBUTING.md with testing guidelines
```

### Before Submitting

1. **Run code quality checks**
   ```bash
   npx nx lint [app-name]
   npx nx test [app-name]
   ```

2. **Ensure your branch is up to date** with the base branch

3. **Write a clear PR description** explaining what changes you made and why

### PR Review Process

1. **Automated checks** run via GitHub Actions
2. **Code review** by maintainers - address all feedback
3. **Approval and merge** by maintainers

## Getting Help

- **Setup & Usage**: Check the [README](https://github.com/valory-xyz/autonolas-frontend-mono/blob/main/README.md)
- **Issues**: Search existing issues or create new ones
- **Security**: See [SECURITY.md](https://github.com/valory-xyz/autonolas-frontend-mono/security/policy) for security-related issues

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🚀
