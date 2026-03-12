# Docs app – CLAUDE.md

Guidance for working on the **Docs** app in this repo.

## Purpose

Olas documentation site: static/content-focused. **No wallet or Web3**; no Redux. Used for product and developer documentation.

## Port

**3000** (Next.js default when no port is set in project.json serve options).

## Stack

- **Wallet**: No.
- **State**: No Redux; minimal client state if any.
- **Key libs**: `ui-theme`, `util-constants`, `ui-components`, `util-ssr`.

## Env / backends

- Minimal. Only app-level or build-time vars if needed (e.g. base URL for links). No RPC or Wallet Project ID.

## Structure

- `pages/` – Next.js routes; content pages.
- `components/` – Layout, Meta, doc content components.
- No `store/` or Web3Modal/context.

## Commands

- Serve: `yarn nx run docs:serve`
- Build: `yarn nx run docs:build`
- Test: `yarn nx test docs`
- Lint: `yarn nx lint docs`

## Notes

- Keep this app lightweight; avoid adding wallet or heavy runtime deps. Use shared UI from `libs/` for consistency with other apps.
