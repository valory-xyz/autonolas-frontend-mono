// Lazy so tests can flip process.env per-test without jest.resetModules.
export const getMechAnalyticsUrl = (): string => process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL ?? '';

// Default ON. Set exactly "false" to fall back to the subgraph path.
export const isMechAnalyticsFlagOn = (): boolean =>
  process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS !== 'false';

export const shouldUseMechAnalytics = (): boolean =>
  isMechAnalyticsFlagOn() && getMechAnalyticsUrl() !== '';
