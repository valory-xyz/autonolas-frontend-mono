import { Col, Flex, Row } from 'antd';
import { FC, memo } from 'react';
import { formatEther } from 'viem';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';

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

type RewardsSectionProps = { reward: bigint; topUp: bigint };
export const RewardsSection: FC<RewardsSectionProps> = memo(function RewardsSection({
  reward,
  topUp,
}) {
  return (
    <Flex gap={4} vertical>
      <Flex vertical gap={4}>
        <Row>
          <RewardColumn
            title={'Claimable Reward'}
            statistic={`${rewardsFormatter(reward, 4)} ETH`}
          />
          <RewardColumn
            title={'Claimable Top-Up'}
            statistic={`${rewardsFormatter(topUp, 2)} OLAS`}
          />
        </Row>
      </Flex>

      <Flex vertical gap={4}>
        <Row>
          <RewardColumn
            title={'Next Claimable Reward'}
            statistic={`${rewardsFormatter(reward, 4)} ETH`}
          />
          <RewardColumn
            title={'Next Claimable Top-Up'}
            statistic={`${rewardsFormatter(topUp, 2)} OLAS`}
          />
        </Row>
        <Row>
          <a href="https://tokenomics.olas.network/donate">
            Make donation {UNICODE_SYMBOLS.EXTERNAL_LINK}
          </a>
        </Row>
      </Flex>
    </Flex>
  );
});
