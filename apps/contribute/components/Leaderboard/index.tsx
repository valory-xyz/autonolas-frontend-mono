import { Alert, Col, Row } from 'antd';

import { useAppSelector } from 'store/setup';

import { Campaigns } from './Campaigns';
import { LeaderboardTable } from './LeaderboardTable';

export const Leaderboard = () => {
  const isVerified = useAppSelector((state) => state.setup.isVerified);

  return (
    <Row gutter={[24, 8]}>
      <Col xs={24} lg={14}>
        {!isVerified && (
          <Alert
            type="warning"
            showIcon
            className="mb-16"
            message="Contribute staking is temporarily unavailable. New sign-ups are not available at this time."
          />
        )}
        <LeaderboardTable />
      </Col>
      <Col xs={24} lg={10}>
        <Campaigns />
      </Col>
    </Row>
  );
};
