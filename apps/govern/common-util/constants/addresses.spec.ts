import { DISPENSER_ADDRESS, VOTE_WEIGHTING_ADDRESS } from './addresses';

// The new tokenomics and governance stack on Ethereum (OPE-2034 scope, D32). Govern, Launch and
// Bond all read these shared constants, so they move to it together.
describe('Dispenser and VoteWeighting addresses', () => {
  it('point at the new DispenserProxy', () => {
    expect(DISPENSER_ADDRESS).toBe('0x78Bd94F48CAe623CC74828eCbFEBE3bDF428D83D');
  });

  it('point at the new VoteWeighting', () => {
    expect(VOTE_WEIGHTING_ADDRESS).toBe('0xe8748e2CE2a4621425499bd26Aa8EF95Cf0C0730');
  });
});
