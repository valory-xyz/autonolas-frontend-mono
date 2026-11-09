describe('web3authFlag', () => {
  const originalEnv = process.env;
  let warn: jest.SpyInstance;

  // A fresh module per test, so the once-per-process warning starts unfired.
  const load = (): typeof import('./web3authFlag') => {
    let mod: typeof import('./web3authFlag') | undefined;
    jest.isolateModules(() => {
      mod = jest.requireActual<typeof import('./web3authFlag')>('./web3authFlag');
    });
    return mod as typeof import('./web3authFlag');
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
    process.env = originalEnv;
  });

  describe('isWeb3AuthEnabled', () => {
    it('is enabled only when WEB3AUTH_ENABLED is exactly "true"', () => {
      process.env.WEB3AUTH_ENABLED = 'true';
      expect(load().isWeb3AuthEnabled()).toBe(true);
      expect(warn).not.toHaveBeenCalled();
    });

    it('is disabled, without a warning, when WEB3AUTH_ENABLED is unset or "false"', () => {
      const { isWeb3AuthEnabled } = load();

      delete process.env.WEB3AUTH_ENABLED;
      expect(isWeb3AuthEnabled()).toBe(false);
      process.env.WEB3AUTH_ENABLED = 'false';
      expect(isWeb3AuthEnabled()).toBe(false);

      expect(warn).not.toHaveBeenCalled();
    });

    it.each(['TRUE', 'True', '1', 'yes', '', ' true'])(
      'is disabled when WEB3AUTH_ENABLED is %p, and warns',
      (value) => {
        process.env.WEB3AUTH_ENABLED = value;
        expect(load().isWeb3AuthEnabled()).toBe(false);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`"${value}"`));
      },
    );

    it('warns only once per process', () => {
      process.env.WEB3AUTH_ENABLED = 'TRUE';
      const { isWeb3AuthEnabled } = load();

      isWeb3AuthEnabled();
      isWeb3AuthEnabled();

      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWeb3AuthPageProps', () => {
    it('passes the flag to the page', async () => {
      const { getWeb3AuthPageProps } = load();
      const ctx = {} as Parameters<typeof getWeb3AuthPageProps>[0];

      process.env.WEB3AUTH_ENABLED = 'true';
      expect(await getWeb3AuthPageProps(ctx)).toEqual({ props: { web3AuthEnabled: true } });

      delete process.env.WEB3AUTH_ENABLED;
      expect(await getWeb3AuthPageProps(ctx)).toEqual({ props: { web3AuthEnabled: false } });
    });
  });
});
