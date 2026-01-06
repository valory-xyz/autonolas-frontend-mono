import { Card, Flex, List, Skeleton, Statistic, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from 'libs/ui-theme/src';
import { NA } from 'libs/util-constants/src';
import { areAddressesEqual } from 'libs/util-functions/src';

import { BadgeLoading, ShowBadge } from 'components/ShowBadge';
import TruncatedEthereumLink from 'components/TruncatedEthereumLink';
import { getLatestMintedNft } from 'common-util/api';
import { getName, getTier } from 'common-util/functions';
import { useAppSelector } from 'store/setup';
import { LeaderboardUser, Tweet } from 'store/types';

import { ConnectTwitterModal } from '../ConnectTwitter/Modal';
import { PointsShowcase } from './PointsShowcase';
import { Staking } from './Staking';

const { Title, Text } = Typography;

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 880px;
  margin: auto;

  .ant-statistic-content {
    line-height: 1;
  }
`;

const ProfileContent = styled.div`
  display: flex;
  gap: 24px;

  > div:first-child {
    width: 100%;
    max-width: 225px;
  }

  > div:last-child {
    width: 100%;
  }

  ${MEDIA_QUERY.tabletL} {
    flex-direction: column;

    > div:first-child {
      max-width: 100%;
    }
  }
`;

type ProfileBodyProps = {
  profile: LeaderboardUser | undefined;
  tweets: Tweet[];
  id: string;
};

const ProfileBody: React.FC<ProfileBodyProps> = ({ profile, tweets, id }) => {
  const [isBadgeLoading, setIsBadgeLoading] = useState(false);
  const [details, setDetails] = useState<{ image: string; tokenId: string } | null>(null);
  const account = useAppSelector((state) => state.setup.account);

  useEffect(() => {
    const getData = async () => {
      try {
        setIsBadgeLoading(true);
        const { details: badgeDetails } = await getLatestMintedNft(profile?.wallet_address);
        setDetails(badgeDetails);
      } catch (error) {
        console.error(error);
      } finally {
        setIsBadgeLoading(false);
      }
    };

    getData();
  }, [profile?.wallet_address]);

  const getTwitterHandle = () => {
    if (profile?.twitter_handle) {
      return <Text type="secondary">{profile.twitter_handle}</Text>;
    }
    if (account && areAddressesEqual(id, account)) {
      return (
        <>
          <Text type="secondary">X not connected</Text>
          <ConnectTwitterModal />
        </>
      );
    }
    return NA;
  };

  return (
    <Root>
      <Card bordered={false}>
        <Title level={3} className="mb-32">
          {getName(profile, account)}
        </Title>

        <ProfileContent>
          <div>
            <Title level={5}>Badge</Title>
            {isBadgeLoading ? (
              <BadgeLoading />
            ) : (
              <>
                {details?.image ? (
                  <ShowBadge image={details?.image} tokenId={details?.tokenId} />
                ) : (
                  <Text type="secondary">No badge yet</Text>
                )}
              </>
            )}
            <Title level={5} className="mt-24">
              Details
            </Title>
            <List bordered style={{ background: COLOR.WHITE }}>
              <List.Item>
                <Flex vertical gap={8}>
                  <Text>Wallet Address</Text>
                  <TruncatedEthereumLink text={id} />
                </Flex>
              </List.Item>
              <List.Item>
                <Flex vertical gap={8}>
                  <Text>X Handle</Text>
                  {getTwitterHandle()}
                </Flex>
              </List.Item>
            </List>
          </div>

          <div>
            <Title level={5}>Leaderboard</Title>
            <Flex gap={96} className="mb-24">
              <Statistic
                title="Tier"
                value={profile?.points ? getTier(profile.points) : NA}
                formatter={(value) => <Text className="font-weight-600">{value}</Text>}
              />
              <Statistic
                title="Points"
                value={profile?.points ?? NA}
                formatter={(value) => <Text className="font-weight-600">{value}</Text>}
              />
            </Flex>
            <PointsShowcase tweetsData={tweets} />
          </div>
        </ProfileContent>
      </Card>

      {account && areAddressesEqual(id, account) && <Staking profile={profile} tweets={tweets} />}
    </Root>
  );
};

export const Profile: React.FC = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { leaderboard, isLeaderboardLoading, tweets, isTweetsLoading } = useAppSelector(
    (state) => state.setup,
  );
  const profile = leaderboard.find((item: LeaderboardUser) => item.wallet_address === id);
  const userTweets = profile
    ? tweets.filter((tweet: Tweet) => tweet.twitter_user_id === profile.twitter_id)
    : [];

  if (isLeaderboardLoading || isTweetsLoading || leaderboard.length === 0 || tweets.length === 0) {
    return <Skeleton active />;
  }

  return (
    <ProfileBody
      profile={
        profile ? { ...profile, service_id_old: null, service_multisig_old: null } : undefined
      }
      tweets={userTweets}
      id={id}
    />
  );
};
