// Lazy so tests can flip process.env per-test without jest.resetModules.
export const getMechAnalyticsUrl = (): string => process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL ?? '';

// Kept in sync with mech-analytics `etl/agents.py:SUPPORTED_CHAINS`.
export const MECH_ANALYTICS_SUPPORTED_CHAIN_IDS: ReadonlyArray<number> = [10, 100, 137, 8453];

export const isMechAnalyticsSupportedChain = (chainId: number): boolean =>
  MECH_ANALYTICS_SUPPORTED_CHAIN_IDS.includes(chainId);

// Case-sensitive on purpose — `"True"` / `"1"` must not silently flip a
// production consumer.
export const isMechAnalyticsFlagOn = (): boolean =>
  process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS === 'true';

export const shouldUseMechAnalytics = (chainId: number): boolean =>
  isMechAnalyticsFlagOn() && isMechAnalyticsSupportedChain(chainId) && getMechAnalyticsUrl() !== '';
