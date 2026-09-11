// jest.setup.js mocks this module globally as `[{ id: 1 }]`, which has no networkName. Override
// it with the real slug shape — `networkName` is `kebabCase(chain.name)`, which is what the built
// routes use (verified by the 8 network pages the build generates).
jest.mock('common-util/Login/config', () => ({
  EVM_SUPPORTED_CHAINS: [
    { id: 1, networkName: 'ethereum' },
    { id: 10, networkName: 'op-mainnet' },
    { id: 100, networkName: 'gnosis' },
    { id: 137, networkName: 'polygon' },
    { id: 8453, networkName: 'base' },
    { id: 42161, networkName: 'arbitrum-one' },
  ],
  SVM_SUPPORTED_CHAINS: [],
  SUPPORTED_CHAINS: [],
  ALL_SUPPORTED_CHAINS: [],
}));

import { getChainIdFromPath } from './index';

/**
 * This is the whole reason marketplace pages can server-render at all.
 *
 * The Layout hides the page body until it knows the chain. That value lived only in Redux, set
 * from an effect, so it was null during a server render and every page served an empty body.
 * Deriving it from the route makes it available on the server — but only if it keeps agreeing
 * with what `useHandleRoute` dispatches, or the gate opens on one render and shuts on the next.
 */
describe('getChainIdFromPath', () => {
  it('maps known network slugs to their chain id', () => {
    expect(getChainIdFromPath('ethereum')).toBe(1);
    expect(getChainIdFromPath('gnosis')).toBe(100);
    expect(getChainIdFromPath('polygon')).toBe(137);
    expect(getChainIdFromPath('base')).toBe(8453);
  });

  it('accepts multi-word slugs as they appear in routes', () => {
    expect(getChainIdFromPath('arbitrum-one')).toBe(42161);
    expect(getChainIdFromPath('op-mainnet')).toBe(10);
  });

  it('is case-insensitive, since route validation accepts mixed case', () => {
    expect(getChainIdFromPath('Ethereum')).toBe(1);
    expect(getChainIdFromPath('GNOSIS')).toBe(100);
  });

  // Solana listings come from a different source, so it must not resolve to an EVM chain —
  // the gate falls through to its existing `isSvm` branch instead.
  it('returns undefined for non-EVM and unknown networks', () => {
    expect(getChainIdFromPath('solana')).toBeUndefined();
    expect(getChainIdFromPath('not-a-network')).toBeUndefined();
  });

  it('returns undefined when the route has no network segment', () => {
    expect(getChainIdFromPath(undefined)).toBeUndefined();
    expect(getChainIdFromPath(['ethereum', 'gnosis'])).toBeUndefined();
  });

  // It runs inside the Layout render, so throwing here would blank the page it exists to fill.
  it('tolerates a chain entry with no networkName', () => {
    expect(() => getChainIdFromPath('ethereum')).not.toThrow();
  });
});
