import { isMechAnalyticsFlagOn, shouldUseMechAnalytics } from 'common-util/mechAnalytics/config';

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

  describe('shouldUseMechAnalytics', () => {
    it('is false when the flag is off', () => {
      process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS = 'false';
      process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL = 'https://ma.example';
      expect(shouldUseMechAnalytics()).toBe(false);
    });

    it('is false when the URL is missing', () => {
      delete process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL;
      expect(shouldUseMechAnalytics()).toBe(false);
    });

    it('is true with URL set and flag unset (default-on)', () => {
      delete process.env.NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS;
      process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL = 'https://ma.example';
      expect(shouldUseMechAnalytics()).toBe(true);
    });
  });
});
