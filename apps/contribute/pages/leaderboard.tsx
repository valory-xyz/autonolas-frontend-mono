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
 * Both tables on this page — the rankings and the live campaigns — used to fill from the browser
 * only, the rankings by way of the health-check poll in `ServiceStatus`, of all things. The served
 * HTML carried the words "No data" in each. That is the one empty state that must never reach a
 * crawler: it reads as "this leaderboard has nobody on it".
 *
 * Both fetchers are plain server functions, so they are called here directly rather than through
 * `/api/*`. The client still refreshes into Redux, which takes precedence over these rows as soon
 * as it arrives.
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
