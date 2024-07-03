import { Col, Row } from 'antd';
import { memo } from 'react';
import { formatEther } from 'viem';

import { RewardsStatistic } from '../styles';

/**
 * Formats reward values to required decimal places
 */
const rewardsFormatter = (reward: bigint, dp: number) =>
  parseFloat(formatEther(reward)).toLocaleString('en', {
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  });

const RewardColumn = ({ title, statistic }: { title: string; statistic: string }) => (
  <Col span={24} xl={12}>
    <RewardsStatistic title={title} value={statistic} />
  </Col>
);

export const RewardsSection = memo(function RewardsSection({
  reward,
  topUp,
}: {
  reward: bigint;
  topUp: bigint;
}) {
  return (
    <Row>
      <RewardColumn title={'Claimable Reward'} statistic={`${rewardsFormatter(reward, 4)} ETH`} />
      <RewardColumn title={'Claimable Top-Up'} statistic={`${rewardsFormatter(topUp, 2)} OLAS`} />
    </Row>
  );
});