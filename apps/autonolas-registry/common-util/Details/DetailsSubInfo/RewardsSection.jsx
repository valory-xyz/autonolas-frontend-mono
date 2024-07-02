import { Col, Row } from 'antd';
import PropTypes from 'prop-types';
import { memo } from 'react';
import { formatEther } from 'viem';

import { RewardsStatistic } from '../styles';

/**
 * Formats reward values to required decimal places
 */
const rewardsFormatter = (reward, dp) =>
  parseFloat(formatEther(reward)).toLocaleString('en', {
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  });

const RewardColumn = ({ title, statisticString }) => (
  <Col span={24} xl={12}>
    <RewardsStatistic title={title} value={statisticString} />
  </Col>
);

RewardColumn.propTypes = {
  title: PropTypes.string,
  statisticString: PropTypes.string,
};

const RewardsSection = memo(function RewardsSection({ reward, topUp }) {

  const statistics = {
    reward: `${rewardsFormatter(reward, 4)} ETH`,
    topUp: `${rewardsFormatter(topUp, 2)} OLAS`,
  };

  return (
    <Row>
      <RewardColumn title={'Claimable Reward'} statisticString={statistics.reward} />
      <RewardColumn title={'Claimable Top-Up'} statisticString={statistics.topUp} />
    </Row>
  );
});

RewardsSection.propTypes = {
  reward: PropTypes.string,
  topUp: PropTypes.string,
};

export default RewardsSection;
