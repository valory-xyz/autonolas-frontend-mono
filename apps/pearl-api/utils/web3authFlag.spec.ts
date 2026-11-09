import { isWeb3AuthEnabled } from './web3authFlag';

describe('isWeb3AuthEnabled', () => {
  const original = process.env.WEB3AUTH_ENABLED;

  afterEach(() => {
    if (original === undefined) delete process.env.WEB3AUTH_ENABLED;
    else process.env.WEB3AUTH_ENABLED = original;
  });

  it('is enabled only when WEB3AUTH_ENABLED is exactly "true"', () => {
    process.env.WEB3AUTH_ENABLED = 'true';
    expect(isWeb3AuthEnabled()).toBe(true);
  });

  it('is disabled when WEB3AUTH_ENABLED is unset', () => {
    delete process.env.WEB3AUTH_ENABLED;
    expect(isWeb3AuthEnabled()).toBe(false);
  });

  it.each(['false', 'TRUE', 'True', '1', 'yes', '', ' true'])(
    'is disabled when WEB3AUTH_ENABLED is %p',
    (value) => {
      process.env.WEB3AUTH_ENABLED = value;
      expect(isWeb3AuthEnabled()).toBe(false);
    },
  );
});
