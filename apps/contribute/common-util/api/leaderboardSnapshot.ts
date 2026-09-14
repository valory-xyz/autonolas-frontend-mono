import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { LeaderboardUser } from 'store/types';
import { Campaign } from 'types/moduleDetails';

import { fetchLeaderboardData } from './fetchLeaderboardData';
import { fetchModuleDetails } from './fetchModuleDetails';
import { rankLeaderboardUsers, toLeaderboardUsers } from './leaderboard';

/** Budget for the paginated AFMDB read plus the module details. */
const ISR_TIMEOUT_MS = 20_000;

export type LeaderboardSnapshot = {
  users: LeaderboardUser[];
  campaigns: Campaign[];
};

export type LeaderboardPageProps = LeaderboardSnapshot & { snapshotGeneratedAt: string | null };

/**
 * One snapshot for `/` and `/leaderboard`, which render the same page. Ranked here so a crawler
 * reads the same ordering a visitor sees; the client re-ranks from Redux once it has fetched.
 */
export const getLeaderboardStaticProps = createSnapshotGetStaticProps<
  LeaderboardSnapshot,
  LeaderboardPageProps
>({
  fetchSnapshot: async () => {
    const [agents, moduleDetails] = await Promise.all([
      fetchLeaderboardData(),
      fetchModuleDetails(),
    ]);
    const campaigns = (moduleDetails?.[0]?.json_value?.twitter_campaigns?.campaigns ?? []).filter(
      (campaign) => campaign.status === 'live',
    );
    return { users: rankLeaderboardUsers(toLeaderboardUsers(agents)), campaigns };
  },
  emptyValue: { users: [], campaigns: [] },
  timeoutMs: ISR_TIMEOUT_MS,
  label: 'contribute/leaderboard',
  toProps: ({ data, generatedAt }) => ({ ...data, snapshotGeneratedAt: generatedAt }),
});
