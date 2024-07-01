import { Col, Row } from 'antd';
import PropTypes from 'prop-types';
import { memo } from 'react';
import { formatEther } from 'viem';

import { RewardsStatistic } from '../styles';

/**
 * Displays rewards earned and rewards top up
 */

const rewardsFormatter = (reward, dp) =>
  parseFloat(formatEther(reward)).toLocaleString('en', {
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  });

const RewardColumn = ({ title, statisticValue }) => (
  <Col span={24} xl={12}>
    <RewardsStatistic title={title} value={statisticValue} />
  </Col>
);
RewardColumn.propTypes = {
  title: PropTypes.string,
  statisticValue: PropTypes.string,
};

const RewardsSection = memo(function RewardsSection({ reward, topUp }) {
  const statisticValue = {
    reward: `${rewardsFormatter(reward, 4)} ETH`,
    topUp: `${rewardsFormatter(topUp, 2)} OLAS`,
  };

  return (
    <Row>
      <RewardColumn title={'Claimable Reward'} statisticString={statisticValue.reward} />
      <RewardColumn title={'Claimable Top-Up'} statisticString={statisticValue.topUp} />
    </Row>
  );
});

RewardsSection.propTypes = {
  reward: PropTypes.string,
  topUp: PropTypes.string,
};

export default RewardsSection;
