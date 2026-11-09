/** Server-only (no NEXT_PUBLIC_ prefix): call from API routes / getServerSideProps, and import from this file, not the utils barrel. */
export const isWeb3AuthEnabled = (): boolean => process.env.WEB3AUTH_ENABLED === 'true';
