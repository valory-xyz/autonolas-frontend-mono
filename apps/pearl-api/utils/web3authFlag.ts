/**
 * Whether Google/Apple (Web3Auth) backup-wallet setup and recovery are offered.
 *
 * Server-only: `WEB3AUTH_ENABLED` has no `NEXT_PUBLIC_` prefix, so it is undefined in the
 * client bundle. Call this from API routes and `getServerSideProps` only, and import it from
 * this file rather than the `utils` barrel.
 *
 * Fails closed: anything but the exact string `true`, including an unset variable, is disabled.
 */
export const isWeb3AuthEnabled = (): boolean => process.env.WEB3AUTH_ENABLED === 'true';
