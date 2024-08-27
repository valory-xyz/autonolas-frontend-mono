export const TOKENOMICS_UNIT_TYPES = { COMPONENT: '0', AGENT: '1' } as const;

export type TokenomicsUnitTypes =
  (typeof TOKENOMICS_UNIT_TYPES)[keyof typeof TOKENOMICS_UNIT_TYPES];
