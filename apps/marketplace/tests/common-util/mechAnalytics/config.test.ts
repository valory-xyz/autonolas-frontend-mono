import {
  isMechAnalyticsFlagOn,
  isMechAnalyticsSupportedChain,
  MECH_ANALYTICS_CHAIN_IDS,
  shouldUseMechAnalytics,
} from 'common-util/mechAnalytics/config';

describe('mechAnalytics/config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isMechAnalyticsFlagOn', () => {
    it('is true when unset', () => {
      delete process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS;
      expect(isMechAnalyticsFlagOn()).toBe(true);
    });

    it('is false for exact "false"', () => {
      process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = 'false';
      expect(isMechAnalyticsFlagOn()).toBe(false);
    });

    it.each(['False', 'FALSE', '0', 'no', '', 'true', 'True'])(
      'is true for %p — only exact "false" opts out',
      (value) => {
        process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = value;
        expect(isMechAnalyticsFlagOn()).toBe(true);
      },
    );
  });

  describe('MECH_ANALYTICS_CHAIN_IDS', () => {
    // Guards silent extension — moves in lockstep with etl/agents.py.
    it('supports exactly optimism, gnosis, polygon, base', () => {
      expect([...MECH_ANALYTICS_CHAIN_IDS].sort((a, b) => a - b)).toEqual([10, 100, 137, 8453]);
    });

    it.each([1, 42161])('does not support chain %p', (chainId) => {
      expect(isMechAnalyticsSupportedChain(chainId)).toBe(false);
    });
  });

  describe('shouldUseMechAnalytics', () => {
    it('is false when the flag is off', () => {
      process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = 'false';
      expect(shouldUseMechAnalytics(100)).toBe(false);
    });

    it('is true with no env set at all, since the API URL is built in', () => {
      // A deploy that never sets any mech-analytics env must still take the
      // mech-analytics path, not silently fall back to the subgraph.
      delete process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS;
      delete process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL;
      expect(shouldUseMechAnalytics(100)).toBe(true);
    });

    it('is false on unsupported chains (Ethereum, Arbitrum)', () => {
      expect(shouldUseMechAnalytics(1)).toBe(false);
      expect(shouldUseMechAnalytics(42161)).toBe(false);
    });

    it('is true on every supported chain with the flag unset (default-on)', () => {
      delete process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS;
      for (const chainId of MECH_ANALYTICS_CHAIN_IDS) {
        expect(shouldUseMechAnalytics(chainId)).toBe(true);
      }
    });
  });
});
