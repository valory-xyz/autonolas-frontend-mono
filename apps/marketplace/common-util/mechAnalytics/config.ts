// Lazy so tests can flip process.env per-test without jest.resetModules.
export const getMechAnalyticsUrl = (): string => process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL ?? '';

// Default ON. Set exactly "false" to fall back to the subgraph path.
export const isMechAnalyticsFlagOn = (): boolean =>
  process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS !== 'false';

// Chains mech-analytics ingests (etl/agents.py:SUPPORTED_CHAINS). Chains
// outside this set — mainly Ethereum (1) and Arbitrum (42161) on the
// marketplace app — would get an empty 200 from /v1/data/scored-rows,
// which blanks the activity tab without an error. Gate here so those
// chains keep using the subgraph.
export const MECH_ANALYTICS_CHAIN_IDS: ReadonlyArray<number> = [10, 100, 137, 8453];

export const isMechAnalyticsSupportedChain = (chainId: number): boolean =>
  MECH_ANALYTICS_CHAIN_IDS.includes(chainId);

export const shouldUseMechAnalytics = (chainId: number): boolean =>
  isMechAnalyticsFlagOn() && isMechAnalyticsSupportedChain(chainId) && getMechAnalyticsUrl() !== '';
