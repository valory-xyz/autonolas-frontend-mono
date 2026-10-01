import { parseAchievementApiQueryParams } from './api';

const OMEN_BET_ID = '0x588343e0d4c6b6c3ed6c5e1a4f2a6b0c9e3e5c5b4a6d7e8f9a0b1c2d3e4f5a6b3f000000';
const SQUID_BET_ID = '0x90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d6c07_520';

describe('parseAchievementApiQueryParams', () => {
  it.each([
    ['omenstrat', OMEN_BET_ID],
    ['polystrat', SQUID_BET_ID],
  ])('accepts agent=%s with id %s', (agent, id) => {
    expect(parseAchievementApiQueryParams({ agent, type: 'payout', id })).toEqual({
      agent,
      type: 'payout',
      id,
    });
  });

  it('rejects an unknown agent', () => {
    expect(parseAchievementApiQueryParams({ agent: 'omen', type: 'payout', id: 'abc' })).toBeNull();
  });

  it.each(['a/b', 'a.b', 'a b', '../x'])('rejects the path-unsafe id %s', (id) => {
    expect(parseAchievementApiQueryParams({ agent: 'omenstrat', type: 'payout', id })).toBeNull();
  });
});
