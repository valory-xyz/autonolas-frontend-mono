# Contributing to Autonolas Frontend Mono

Thank you for your interest in contributing to the Autonolas Frontend Mono repository! This document provides guidelines and information for contributors.

## Table of Contents

- [Project Overview](#project-overview)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Getting Help](#getting-help)

## Project Overview

This is an Nx monorepo containing multiple Next.js frontend applications for the Autonolas ecosystem:

- **marketplace**: AI agent and component marketplace
- **bond**: Bonding mechanisms
- **govern**: Governance interface
- **launch**: Service launching
- **operate**: Service operations
- **build**: (Work in progress)
- **contribute**: Contribution interface
- **docs**: Documentation site
- **tokenomics**: Token economics interface

Additionally, the repository contains shared libraries in the `libs/` directory for common functionality across applications.

## Development Setup

### Prerequisites

- **Node.js**: Version 18.x or higher
- **Yarn**: Package manager

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/valory-xyz/autonolas-frontend-mono.git
   cd autonolas-frontend-mono
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Run a specific app**: See the [README for instructions on starting the apps](https://github.com/valory-xyz/autonolas-frontend-mono?tab=readme-ov-file#start-the-app)

### Development Commands

Common commands you'll use:

| Command | Description |
|---------|-------------|
| `npx nx serve [app-name]` | Start development server for a specific app |
| `npx nx test [app-name]` | Run tests for a specific app or library |
| `npx nx lint [app-name]` | Run linting for a specific app or library |
| `npx nx reset` | Clear the Nx cache |

## Development Workflow

### 1. Choose an Issue

- Check the [Issues](https://github.com/valory-xyz/autonolas-frontend-mono/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

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
- Update documentation if needed

### 4. Test Your Changes

- Run the affected app locally
- Run tests: `npx nx test [app-name]`
- Run linting: `npx nx lint [app-name]`
- Ensure all checks pass

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

### Before Submitting

1. **Run code quality checks**
   ```bash
   npx nx lint [app-name]
   npx nx test [app-name]
   ```

2. **Update documentation** if your changes affect user-facing features or developer workflows

3. **Ensure your branch is up to date** with the base branch

### PR Review Process

1. **Automated checks** run via GitHub Actions
2. **Code review** by maintainers
3. **Feedback incorporation** - address review comments
4. **Approval and merge** by maintainers

## Getting Help

- **Documentation**: Check the [README](https://github.com/valory-xyz/autonolas-frontend-mono/blob/main/README.md)
- **Issues**: Search existing issues or create new ones
- **Security**: See [SECURITY.md](https://github.com/valory-xyz/autonolas-frontend-mono/security/policy) for security-related issues

## License

By contributing to this project, you agree that your contributions will be licensed under the Apache 2.0 License.

Thank you for contributing! 🚀
