import { Col, Row } from 'antd';
import PropTypes from 'prop-types';

import { RewardsStatistic } from '../styles';

/**
 * Displays rewards earned and rewards top up
 */
const RewardsSection = ({ reward, topUp }) => {
  return (
    <Row>
      <Col span={24} xl={12}>
        <RewardsStatistic title="Claimable Reward" value={reward} suffix="ETH" />
      </Col>
      <Col span={24} xl={12}>
        <RewardsStatistic title="Claimable Top Up" value={topUp} suffix="OLAS" />
      </Col>
    </Row>
  );
};
RewardsSection.propTypes = {
  reward: PropTypes.string,
  topUp: PropTypes.string,
};
RewardsSection.defaultProps = {
  reward: '0',
  topUp: '0',
};

export default RewardsSection;
