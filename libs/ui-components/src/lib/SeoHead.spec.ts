import { isRouteTemplate, selfUrl } from './SeoHead';

// The exact inputs that produced wrong canonicals in production: a `SITE_URL` with a
// trailing slash (docs, build), and a `[` that belongs to a query value, not the route.
describe('selfUrl', () => {
  it('accepts a site URL with or without a trailing slash', () => {
    expect(selfUrl('https://docs.olas.network/', '/')).toBe('https://docs.olas.network/');
    expect(selfUrl('https://bond.olas.network', '/')).toBe('https://bond.olas.network/');
    expect(selfUrl('https://build.olas.network/', '/paths/1')).toBe(
      'https://build.olas.network/paths/1',
    );
  });

  it('drops the query string, hash and trailing slash from the path', () => {
    expect(selfUrl('https://build.olas.network', '/paths/1?q=[x]#top')).toBe(
      'https://build.olas.network/paths/1',
    );
    expect(selfUrl('https://build.olas.network', '/paths/')).toBe(
      'https://build.olas.network/paths',
    );
  });
});

describe('isRouteTemplate', () => {
  it('is true only for an unresolved route, not for a bracket in the query', () => {
    expect(isRouteTemplate('/paths/[id]')).toBe(true);
    expect(isRouteTemplate('/[network]/my-staking-contracts')).toBe(true);
    expect(isRouteTemplate('/paths/1?q=[x]')).toBe(false);
    expect(isRouteTemplate('/paths/1#[x]')).toBe(false);
    expect(isRouteTemplate('/')).toBe(false);
  });
});
