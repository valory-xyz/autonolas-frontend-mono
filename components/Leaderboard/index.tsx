import { Col, Row, Typography } from 'antd';

import { useAppSelector } from 'store/setup';

import { ConnectTwitterModal } from '../ConnectTwitter/Modal';
import { Campaigns } from './Campaigns';
import { LeaderboardTable } from './LeaderboardTable';
import { TwitterCard } from './styles';

const { Text } = Typography;

export const Leaderboard = () => {
  const isVerified = useAppSelector((state) => state.setup.isVerified);

  return (
    <Row gutter={[24, 8]}>
      <Col xs={24} lg={14}>
        {!isVerified && (
          <TwitterCard>
            <Text>Connect X and start earning points</Text>
            <ConnectTwitterModal />
          </TwitterCard>
        )}
        <LeaderboardTable />
      </Col>
      <Col xs={24} lg={10}>
        <Campaigns />
      </Col>
    </Row>
  );
};
