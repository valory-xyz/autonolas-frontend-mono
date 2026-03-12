import { Button, Card, Flex, Typography } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';

import { LeaderboardUser, Tweet } from 'store/types';

import { StakingDetails } from './StakingDetails';
import { useUpdateProfileIfOldServiceTerminated } from './hooks';

const { Title, Paragraph } = Typography;

const ImageContainer = styled.div`
  img {
    position: relative !important;
  }
`;

const SetupStaking = () => (
  <>
    <ImageContainer>
      <Image src="/images/set-up-staking.png" alt="Staking" layout="fill" objectFit="contain" />
    </ImageContainer>
    <Flex className="mt-24" justify="center">
      <Link href="/staking" passHref>
        <Button type="primary">Set up staking</Button>
      </Link>
    </Flex>
  </>
);

type StakingProps = {
  profile?: LeaderboardUser;
  tweets: Tweet[];
};

export const Staking = ({ profile, tweets }: StakingProps) => {
  const hasStaked = !!(profile?.service_id_old || profile?.service_id);

  useUpdateProfileIfOldServiceTerminated(profile);

  return (
    <Card bordered={false}>
      <Title level={3} className="mb-8">
        Staking
      </Title>
      <Paragraph type="secondary" className="mb-24">
        Staking allows you to earn OLAS rewards when you post about Olas on X.
      </Paragraph>
      {profile && hasStaked ? (
        <StakingDetails profile={profile} tweets={tweets} />
      ) : (
        <SetupStaking />
      )}
    </Card>
  );
};
