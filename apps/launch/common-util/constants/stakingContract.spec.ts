import { STAKING_TOKEN_ADDRESSES } from './stakingContract';
// `stakingTokenAddress` of autonolas-registries' `scripts/deployment` globals at 5d5b1f1
// (autonolas-registries#343), stored as `implementation`: the StakingToken 0.4.0
// implementations Proposal 17 enables.
import pinnedGlobals from './registries-staking-token-globals.json';

describe('STAKING_TOKEN_ADDRESSES', () => {
  it('creates staking contracts from the published StakingToken 0.4.0 on every chain', () => {
    const published = Object.fromEntries(
      Object.entries(pinnedGlobals).map(([chainId, { implementation }]) => [
        chainId,
        implementation,
      ]),
    );

    expect(STAKING_TOKEN_ADDRESSES).toEqual(published);
  });
});
