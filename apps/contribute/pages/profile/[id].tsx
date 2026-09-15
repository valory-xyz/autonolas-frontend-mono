import { GetStaticPaths, GetStaticProps } from 'next';
import { isAddress } from 'viem';

import { areAddressesEqual, truncateAddress } from 'libs/util-functions/src';
import { withTimeout } from 'libs/util-ssr/src';

import { Profile } from 'components/Profile';
import Meta from 'components/meta';

import { fetchLeaderboardData } from 'common-util/api/fetchLeaderboardData';
import { toLeaderboardUsers } from 'common-util/api/leaderboard';
import { getTier } from 'common-util/functions';
import { LeaderboardUser } from 'store/types';

type ProfilePageProps = {
  id: string;
  pageTitle: string;
  description: string;
};

/** Budget for the paginated AFMDB read. */
const LOOKUP_TIMEOUT_MS = 20_000;
const REVALIDATE_SECONDS = 300;
const REVALIDATE_ON_ERROR_SECONDS = 60;

/** Like `getName`, but with the address truncated so the title stays short. */
const getDisplayName = (profile: LeaderboardUser | undefined, id: string) =>
  profile?.twitter_handle || profile?.discord_handle || truncateAddress(id);

/** Profiles are one per wallet, so they are rendered on first request rather than at build. */
export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });

/** Per-profile meta so crawlers stop seeing every profile as a duplicate page. */
export const getStaticProps: GetStaticProps<ProfilePageProps> = async ({ params }) => {
  const id = String(params?.id ?? '');
  if (!isAddress(id, { strict: false })) return { notFound: true };

  try {
    const agents = await withTimeout(
      fetchLeaderboardData(),
      LOOKUP_TIMEOUT_MS,
      'contribute/profile',
    );
    const profile = toLeaderboardUsers(agents).find((user) =>
      areAddressesEqual(user.wallet_address, id),
    );
    const name = getDisplayName(profile, id);
    const points = profile?.points ?? 0;

    return {
      props: {
        id,
        pageTitle: `${name}'s Profile`,
        description: `${name} has earned ${points.toLocaleString('en-US')} points (${getTier(points)} tier) on Olas Contribute. See their badge, completed actions and contribution history.`,
      },
      revalidate: REVALIDATE_SECONDS,
    };
  } catch (error) {
    console.error('[contribute/profile] leaderboard lookup failed:', error);
    const name = truncateAddress(id);

    return {
      props: {
        id,
        pageTitle: `${name}'s Profile`,
        description: `View ${name}'s Olas Contribute profile: points earned, badge level, completed actions and contribution history.`,
      },
      revalidate: REVALIDATE_ON_ERROR_SECONDS,
    };
  }
};

const ProfilePage = ({ id, pageTitle, description }: ProfilePageProps) => (
  <>
    <Meta pageTitle={pageTitle} description={description} pageUrl={`profile/${id}`} />
    <Profile />
  </>
);

export default ProfilePage;
