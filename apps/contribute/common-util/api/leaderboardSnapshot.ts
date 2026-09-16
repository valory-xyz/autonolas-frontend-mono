import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { LeaderboardUser } from 'store/types';
import { Campaign } from 'types/moduleDetails';

import { readLeaderboardForPrerender } from './leaderboardCache';
import { fetchModuleDetails } from './fetchModuleDetails';
import { rankLeaderboardUsers, toLeaderboardUsers } from './leaderboard';

export type LeaderboardSnapshot = {
  users: LeaderboardUser[];
  campaigns: Campaign[];
};

export type LeaderboardPageProps = LeaderboardSnapshot & { snapshotGeneratedAt: string | null };

/** Budget for the paginated AFMDB read. */
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
 * `/` and `/leaderboard` render the same tables, so they share one snapshot rather than each
 * reading AFMDB their own way. `/` used to do this read per request in `getServerSideProps`:
 * seven sequential AFMDB pages and ~6k rows on every hit, uncached, which put the homepage at
 * a 4s floor and coupled its uptime to AFMDB. Here it is read once per revalidation window.
 */
export const getLeaderboardStaticProps = createSnapshotGetStaticProps<
  LeaderboardSnapshot,
  LeaderboardPageProps
>({
  fetchSnapshot: async () => {
    const [agents, moduleDetails] = await Promise.all([
      readLeaderboardForPrerender(),
      fetchModuleDetails(),
    ]);
    const campaigns = (moduleDetails?.[0]?.json_value?.twitter_campaigns?.campaigns ?? []).filter(
      (campaign) => campaign.status === 'live',
    );
    return { users: rankLeaderboardUsers(toLeaderboardUsers(agents)), campaigns };
  },
  emptyValue: { users: [], campaigns: [] },
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  label: 'contribute/leaderboard',
  toProps: ({ data, generatedAt }) => ({ ...data, snapshotGeneratedAt: generatedAt }),
});
