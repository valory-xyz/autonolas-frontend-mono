import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { Leaderboard } from 'components/Leaderboard';
import Meta from 'components/meta';

import { fetchLeaderboardData } from 'common-util/api/fetchLeaderboardData';
import { fetchModuleDetails } from 'common-util/api/fetchModuleDetails';
import { toLeaderboardUsers } from 'common-util/api/leaderboard';
import { LeaderboardUser } from 'store/types';
import { Campaign } from 'types/moduleDetails';

type LeaderboardSnapshot = {
  users: LeaderboardUser[];
  campaigns: Campaign[];
};

/** Budget for the paginated AFMDB read. */
const ISR_TIMEOUT_MS = 20_000;

/**
 * Both tables used to fill from the browser only, so the served HTML said "No data" twice.
 * Fetched here directly; Redux takes over once the client refreshes.
 */
export const getStaticProps = createSnapshotGetStaticProps<
  LeaderboardSnapshot,
  LeaderboardSnapshot
>({
  fetchSnapshot: async () => {
    const [agents, moduleDetails] = await Promise.all([
      fetchLeaderboardData(),
      fetchModuleDetails(),
    ]);
    const campaigns = (moduleDetails?.[0]?.json_value?.twitter_campaigns?.campaigns ?? []).filter(
      (campaign) => campaign.status === 'live',
    );
    return { users: toLeaderboardUsers(agents), campaigns };
  },
  emptyValue: { users: [], campaigns: [] },
  timeoutMs: ISR_TIMEOUT_MS,
  label: 'contribute/leaderboard',
  toProps: ({ data }) => data,
});

const LeaderboardPage = ({ users, campaigns }: LeaderboardSnapshot) => (
  <>
    <Meta
      pageTitle="Leaderboard"
      description="View the Olas Contribute leaderboard. See top contributors ranked by points, track your position, and discover who's leading the community."
      pageUrl="leaderboard"
    />
    <Leaderboard initialLeaderboard={users} initialCampaigns={campaigns} />
  </>
);

export default LeaderboardPage;
