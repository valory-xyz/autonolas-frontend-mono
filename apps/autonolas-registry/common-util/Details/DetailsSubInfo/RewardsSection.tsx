import { Col, Flex, Row } from 'antd';
import { FC, memo, useEffect, useState } from 'react';
import { formatEther } from 'viem';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';

import { RewardsStatistic } from '../styles';
import { getMapUnitIncentivesRequest } from './rewards';

type PendingReward = { reward: string; topUp: string };

/**
 * Formats reward values to required decimal places
 */
const rewardsFormatter = (value: bigint, dp: number = 4) =>
  parseFloat(formatEther(value)).toLocaleString('en', {
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
  const [pendingIncentives, setPendingIncentives] = useState<PendingReward | null>({
    reward: '0.00',
    topUp: '0.00',
  });

  useEffect(() => {
    // TODO: Fetch pending incentives
    getMapUnitIncentivesRequest({ unitId: 1, unitType: '0' })
      .then((response) =>
        setPendingIncentives({
          topUp: response.pendingRelativeTopUp,
          reward: response.pendingRelativeTopUp,
        }),
      )
      .catch((e) => console.error(e));
  }, []);

  return (
    <Flex gap={4} vertical>
      <Flex vertical gap={4}>
        <Row>
          <RewardColumn
            title={'Claimable Reward'}
            statistic={`${rewardsFormatter(reward, 4)} ETH`}
          />
          <RewardColumn
            title={'Claimable Top Up'}
            statistic={`${rewardsFormatter(topUp, 2)} OLAS`}
          />
        </Row>
      </Flex>

      <Flex vertical gap={4}>
        <Row>
          <RewardColumn title={'Pending Reward'} statistic={`${pendingIncentives?.reward} ETH`} />
          <RewardColumn title={'Pending Top Up'} statistic={`${pendingIncentives?.topUp} OLAS`} />
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
