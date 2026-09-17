import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { getRankedUsers } from 'store/setup';
import { Campaign } from 'types/moduleDetails';

import { fetchLeaderboardData } from './fetchLeaderboardData';
import { fetchModuleDetails } from './fetchModuleDetails';
import { LeaderboardRow, toLeaderboardRow, toLeaderboardUsers } from './leaderboard';

export type LeaderboardSnapshot = {
  users: LeaderboardRow[];
  campaigns: Campaign[];
};

export type LeaderboardPageProps = LeaderboardSnapshot & { snapshotGeneratedAt: string | null };

/** Budget for the AFMDB read. */
const ISR_TIMEOUT_MS = 20_000;

/**
 * An hour rather than the helper's five minutes. Every visitor's browser refetches both tables
 * (`useFetchApplicationData` in `Layout`), so this window only governs what a crawler reads and
 * what shows for the moment before that lands — and points move slowly enough not to care.
 * Not longer than an hour: campaigns are filtered on `status === 'live'` here, so a stale
 * snapshot advertises a finished campaign for its whole window.
 */
const REVALIDATE_SECONDS = 3600;

/**
 * `/` and `/leaderboard` render the same two tables, so they share one snapshot rather than
 * each reading AFMDB their own way.
 *
 * `/` used to build this per request in `getServerSideProps`, so every visit ran a function and
 * re-rendered every row behind a `no-store` response. Read once per window here instead.
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
    // The same filter and ranking the client applies once its own fetch lands.
    const users = getRankedUsers(toLeaderboardUsers(agents)).map(toLeaderboardRow);
    return { users, campaigns };
  },
  emptyValue: { users: [], campaigns: [] },
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  label: 'contribute/leaderboard',
  toProps: ({ data, generatedAt }) => ({ ...data, snapshotGeneratedAt: generatedAt }),
});
