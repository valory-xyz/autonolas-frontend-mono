import { GetStaticPaths, GetStaticProps } from 'next';
import { getAddress, isAddress } from 'viem';

import { truncateAddress, withTimeout } from 'libs/util-functions/src';

import { Profile } from 'components/Profile';
import Meta from 'components/meta';

import { fetchLeaderboardData } from 'common-util/api/fetchLeaderboardData';
import { toLeaderboardUsers } from 'common-util/api/leaderboard';
import { getTier } from 'common-util/functions';
import { LeaderboardUser } from 'store/types';
import { SSR_TIMEOUT_MS } from 'util/constants';

type ProfilePageProps = {
  id: string;
  pageTitle: string;
  description: string;
};

const REVALIDATE_SECONDS = 300;
const REVALIDATE_ON_ERROR_SECONDS = 60;

/** Profiles are one per wallet, so they are rendered on first request rather than at build. */
export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });

/** Like `getName`, but with the address truncated so the title stays short. */
const getDisplayName = (profile: LeaderboardUser | undefined, id: string) =>
  profile?.twitter_handle || profile?.discord_handle || truncateAddress(id);

const toProps = (id: string, profile: LeaderboardUser | undefined): ProfilePageProps => {
  const name = getDisplayName(profile, id);
  if (!profile) {
    return {
      id,
      pageTitle: `${name}'s Profile`,
      description: `View ${name}'s Olas Contribute profile: points earned, badge level, completed actions and contribution history.`,
    };
  }

  const points = profile.points.toLocaleString('en-US');
  return {
    id,
    pageTitle: `${name}'s Profile`,
    description: `${name} has earned ${points} points (${getTier(profile.points)} tier) on Olas Contribute. See their badge, completed actions and contribution history.`,
  };
};

/** Per-profile meta so crawlers stop seeing every profile as a duplicate page. */
export const getStaticProps: GetStaticProps<ProfilePageProps> = async ({ params }) => {
  const id = String(params?.id ?? '');
  if (!isAddress(id, { strict: false })) return { notFound: true };

  // AFMDB and wagmi both use checksummed addresses; one URL per wallet keeps crawlers from
  // seeing lowercase and checksummed variants as duplicates.
  const checksummed = getAddress(id);
  if (checksummed !== id) {
    return { redirect: { destination: `/profile/${checksummed}`, permanent: false } };
  }

  try {
    const agents = await withTimeout(fetchLeaderboardData(), SSR_TIMEOUT_MS);
    const profile = toLeaderboardUsers(agents).find((user) => user.wallet_address === id);
    // Wallets not on the leaderboard are not pages: otherwise any address is an indexable URL.
    if (!profile) return { notFound: true, revalidate: REVALIDATE_SECONDS };
    return { props: toProps(id, profile), revalidate: REVALIDATE_SECONDS };
  } catch (error) {
    // Address-only meta rather than a 404, so an AFMDB blip does not cache a real profile away.
    console.error('[contribute/profile] leaderboard lookup failed:', error);
    return { props: toProps(id, undefined), revalidate: REVALIDATE_ON_ERROR_SECONDS };
  }
};

const ProfilePage = ({ id, pageTitle, description }: ProfilePageProps) => (
  <>
    <Meta pageTitle={pageTitle} description={description} pageUrl={`profile/${id}`} />
    <Profile />
  </>
);

export default ProfilePage;
