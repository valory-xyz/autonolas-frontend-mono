import {
  MECH_ANALYTICS_SUPPORTED_CHAIN_IDS,
  isMechAnalyticsFlagOn,
  isMechAnalyticsSupportedChain,
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
    it('is false when unset', () => {
      delete process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS;
      expect(isMechAnalyticsFlagOn()).toBe(false);
    });

    it.each(['false', 'False', 'True', '1', 'yes', ''])(
      'is false for %p — only exact "true" trips it',
      (value) => {
        process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = value;
        expect(isMechAnalyticsFlagOn()).toBe(false);
      },
    );

    it('is true for exact "true"', () => {
      process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = 'true';
      expect(isMechAnalyticsFlagOn()).toBe(true);
    });
  });

  describe('isMechAnalyticsSupportedChain', () => {
    // Guards silent extension — moves in lockstep with mech-analytics' SUPPORTED_CHAINS.
    it('supports exactly optimism, gnosis, polygon, base', () => {
      expect([...MECH_ANALYTICS_SUPPORTED_CHAIN_IDS].sort((a, b) => a - b)).toEqual([
        10, 100, 137, 8453,
      ]);
    });

    it.each([1, 42161, 43114, 0, -1])('is false for %p', (chainId) => {
      expect(isMechAnalyticsSupportedChain(chainId)).toBe(false);
    });
  });

  describe('shouldUseMechAnalytics', () => {
    it('is false when the flag is off', () => {
      process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = 'false';
      process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL = 'https://ma.example';
      expect(shouldUseMechAnalytics(100)).toBe(false);
    });

    it('is false when the URL is missing', () => {
      process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = 'true';
      delete process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL;
      expect(shouldUseMechAnalytics(100)).toBe(false);
    });

    it('is false on unsupported chains', () => {
      process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = 'true';
      process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL = 'https://ma.example';
      expect(shouldUseMechAnalytics(1)).toBe(false);
      expect(shouldUseMechAnalytics(42161)).toBe(false);
    });
  });
});
