import { Alert, Col, Row } from 'antd';

import { formatUtcTimestamp } from 'libs/util-functions/src';

import { useAppSelector } from 'store/setup';
import { LeaderboardUser } from 'store/types';
import { Campaign } from 'types/moduleDetails';

import { Campaigns } from './Campaigns';
import { LeaderboardTable } from './LeaderboardTable';

type LeaderboardProps = {
  initialLeaderboard?: LeaderboardUser[];
  initialCampaigns?: Campaign[];
  snapshotGeneratedAt?: string | null;
};

export const Leaderboard = ({
  initialLeaderboard,
  initialCampaigns,
  snapshotGeneratedAt,
}: LeaderboardProps) => {
  const isVerified = useAppSelector((state) => state.setup.isVerified);
  const asOf = formatUtcTimestamp(snapshotGeneratedAt ?? null);

  return (
    <Row gutter={[24, 8]}>
      {/* `hidden`, not sr-only: the tables below carry the same rows, so this is for crawlers only. */}
      {asOf && (
        <p hidden>
          {`The rankings and live campaigns are a server-rendered snapshot taken ${asOf}; the page refreshes them once loaded.`}
        </p>
      )}
      <Col xs={24} lg={14}>
        {!isVerified && (
          <Alert
            type="warning"
            showIcon
            className="mb-16"
            message="Contribute staking is temporarily unavailable. New sign-ups are not available at this time."
          />
        )}
        <LeaderboardTable initialLeaderboard={initialLeaderboard} />
      </Col>
      <Col xs={24} lg={10}>
        <Campaigns initialCampaigns={initialCampaigns} />
      </Col>
    </Row>
  );
};
