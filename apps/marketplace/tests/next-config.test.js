const nextConfig = require('../next.config');

describe('marketplace redirects', () => {
  it('permanently redirects legacy arbitrum URLs to arbitrum-one', async () => {
    const config = await nextConfig('phase-development-server', { defaultConfig: {} });
    const redirects = await config.redirects();

    expect(redirects).toContainEqual({
      source: '/arbitrum/:path*',
      destination: '/arbitrum-one/:path*',
      permanent: true,
    });
  });
});
