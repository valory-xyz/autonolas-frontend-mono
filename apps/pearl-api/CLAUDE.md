# Pearl API app – CLAUDE.md

Guidance for working on the **Pearl API** app in this repo.

## Purpose

**API and auth backend** for Olas: provides Next.js API routes and Web3Auth-based flows. Used for support (Zendesk), achievements (image generation), agent eligibility (geo), and Web3Auth login/session management. Not a typical frontend; it’s an API app with a few front-end pages for Web3Auth.

## Port

**3010**

## Stack

- **Wallet / Auth**: **Web3Auth** (modal, login, swap-owner-session). Not WalletConnect for general dapp use; used for embedded auth/session.
- **API routes**: Next.js `pages/api/` – Zendesk (create-ticket, upload-file), achievement (get-image, generate-image), geo (agent-eligibility).
- **Key libs**: No shared Nx libs in project config; uses Next.js, Web3Auth, styled-components, and app-local `context/`, `hooks/`, `utils/`, `constants/`, `types/`.

## Env / backends

- **Web3Auth**: `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`
- **CORS**: `NEXT_PUBLIC_ALLOWED_ORIGIN`
- **Zendesk**: `ZENDESK_SUBDOMAIN`, `ZENDESK_API_TOKEN`, `ZENDESK_API_EMAIL` (see root `.env.example`)

## Structure

- `pages/api/` – Zendesk, achievement, geo API handlers.
- `pages/web3auth/` – Web3Auth login and swap-owner-session pages.
- `context/`, `hooks/`, `components/`, `utils/`, `constants/`, `types/` – App-local code.

## Commands

- Serve: `yarn nx run pearl-api:serve`
- Build: `yarn nx run pearl-api:build`
- Test: `yarn nx test pearl-api`
- Lint: `yarn nx lint pearl-api`

## Notes

- This app is API- and auth-focused; it does not use the same WalletConnect/Web3Modal pattern as Bond, Marketplace, etc.
- Zendesk and Web3Auth env vars must be set for those features to work. CORS is controlled via `NEXT_PUBLIC_ALLOWED_ORIGIN`.
