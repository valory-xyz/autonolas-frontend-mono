import type { GetServerSideProps } from 'next';

import type { Web3AuthPageProps } from '../types/web3auth';

let hasWarnedAboutValue = false;

export const isWeb3AuthEnabled = (): boolean => {
  const value = process.env.WEB3AUTH_ENABLED;

  // Warn on likely typos so a mistyped flag isn't silently off.
  if (value !== undefined && value !== 'true' && value !== 'false' && !hasWarnedAboutValue) {
    hasWarnedAboutValue = true;
    console.warn(
      `WEB3AUTH_ENABLED is "${value}"; only "true" enables Web3Auth, so it is treated as off.`,
    );
  }

  return value === 'true';
};

export const getWeb3AuthPageProps: GetServerSideProps<Web3AuthPageProps> = async () => ({
  props: { web3AuthEnabled: isWeb3AuthEnabled() },
});
