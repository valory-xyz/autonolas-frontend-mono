import type { GetServerSideProps } from 'next';

import type { Web3AuthPageProps } from '../types/web3auth';

let hasWarnedAboutValue = false;

/** Server-only (no NEXT_PUBLIC_ prefix): call from API routes / getServerSideProps, and import from this file, not the utils barrel. */
export const isWeb3AuthEnabled = (): boolean => {
  const value = process.env.WEB3AUTH_ENABLED;

  // Anything but `true` keeps Web3Auth off; flag a likely typo (e.g. `TRUE`) so it is not silent.
  if (value !== undefined && value !== 'true' && value !== 'false' && !hasWarnedAboutValue) {
    hasWarnedAboutValue = true;
    console.warn(
      `WEB3AUTH_ENABLED is "${value}"; only "true" enables Web3Auth, so it is treated as off.`,
    );
  }

  return value === 'true';
};

/** `getServerSideProps` shared by the Web3Auth pages. */
export const getWeb3AuthPageProps: GetServerSideProps<Web3AuthPageProps> = async () => ({
  props: { web3AuthEnabled: isWeb3AuthEnabled() },
});
