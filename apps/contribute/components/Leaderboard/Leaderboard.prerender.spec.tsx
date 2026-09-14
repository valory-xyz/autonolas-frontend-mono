import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { LeaderboardUser } from 'store/types';
import { Campaign } from 'types/moduleDetails';

import { Leaderboard } from './index';

// What the server render and the first client render both see: nothing fetched yet. Importing
// the real store would pull in wagmi, which this app's jest is not configured to transform.
const EMPTY_SETUP = {
  isVerified: false,
  leaderboard: [],
  isLeaderboardLoading: true,
  moduleDetails: null,
  isModuleDetailsLoading: true,
};

// `common-util/functions` imports viem for a type, which is enough to drag wagmi's ESM in. The two
// helpers the table uses are pure, so they are stood in for here.
jest.mock('common-util/functions', () => ({
  getName: (profile?: { twitter_handle?: string | null }) => profile?.twitter_handle ?? 'Unknown',
  getTier: () => 'Basic',
}));

jest.mock('store/setup', () => ({
  useAppSelector: (selector: (state: { setup: typeof EMPTY_SETUP }) => unknown) =>
    selector({ setup: EMPTY_SETUP }),
}));

const user = (handle: string, points: number): LeaderboardUser =>
  ({
    id: points,
    points,
    tweets: [],
    token_id: null,
    discord_id: null,
    service_id: null,
    twitter_id: '1',
    discord_handle: null,
    twitter_handle: handle,
    wallet_address: '0x0000000000000000000000000000000000000001',
    service_multisig: null,
    current_period_points: points,
    service_id_old: null,
    service_multisig_old: null,
    attribute_instance_id: null,
    attribute_id: points,
    rank: null,
  }) as unknown as LeaderboardUser;

const CAMPAIGN = {
  id: '1',
  start_ts: 0,
  end_ts: 0,
  status: 'live',
  voters: [],
  hashtag: 'olas',
  proposer: {},
} as unknown as Campaign;

const renderLeaderboard = (props: Parameters<typeof Leaderboard>[0]) =>
  render(<Leaderboard {...props} />);

/**
 * Guards the Phase 2 contract for this page. Both tables filled from the browser, so the served
 * HTML said "No data" twice — which reads as "this leaderboard has nobody on it".
 */
describe('Leaderboard pre-rendered snapshot', () => {
  it('renders the ranking rows it was given', () => {
    renderLeaderboard({ initialLeaderboard: [user('alice', 900), user('bob', 500)] });

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('renders the live campaigns it was given', () => {
    renderLeaderboard({ initialLeaderboard: [user('alice', 900)], initialCampaigns: [CAMPAIGN] });

    expect(screen.getByText('olas')).toBeInTheDocument();
  });

  it('never serves the bare "No data" empty state', () => {
    renderLeaderboard({ initialLeaderboard: [user('alice', 900)], initialCampaigns: [CAMPAIGN] });

    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });
});
