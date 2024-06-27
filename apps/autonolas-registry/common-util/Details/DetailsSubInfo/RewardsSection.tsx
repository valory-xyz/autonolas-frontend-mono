import { Col, Row } from 'antd';

import { DetailsRewardRecord } from 'types/details';

import { RewardsStatistic } from './styles';

/**
 * Displays rewards earned and rewards top up
 */
const RewardsSection = ({ reward, topUp }: DetailsRewardRecord) => {
  return (
    <Row>
      <Col span={24} xl={12}>
        <RewardsStatistic title={'Claimable Reward'} value={reward} suffix="ETH" />
      </Col>
      <Col span={24} xl={12}>
        <RewardsStatistic title="Claimable Top Up" value={topUp} suffix="OLAS" />
      </Col>
    </Row>
  );
};

export default RewardsSection;
