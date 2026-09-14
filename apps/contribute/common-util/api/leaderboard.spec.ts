import { LeaderboardUser } from 'store/types';

import { rankLeaderboardUsers } from './leaderboard';

jest.mock('common-util/functions', () => ({
  getName: (user: { twitter_handle?: string | null }) => user.twitter_handle ?? '',
}));

const user = (twitter_handle: string, points: number) =>
  ({ twitter_handle, points, rank: null }) as unknown as LeaderboardUser;

// Ranking moved here from the store so the snapshot and the client agree. A crawler reads the
// snapshot as served, so it must already be in the order a visitor sees.
describe('rankLeaderboardUsers', () => {
  it('sorts by points descending, then name', () => {
    const ranked = rankLeaderboardUsers([user('zed', 10), user('amy', 30), user('bob', 30)]);
    expect(ranked.map((u) => u.twitter_handle)).toEqual(['amy', 'bob', 'zed']);
  });

  it('gives tied points the same rank and does not skip after a tie', () => {
    const ranked = rankLeaderboardUsers([user('amy', 30), user('bob', 30), user('zed', 10)]);
    expect(ranked.map((u) => u.rank)).toEqual([1, 1, 2]);
  });

  it('returns an empty list unchanged', () => {
    expect(rankLeaderboardUsers([])).toEqual([]);
  });
});
