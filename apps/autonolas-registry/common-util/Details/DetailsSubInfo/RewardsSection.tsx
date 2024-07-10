import { Col, Flex, Row } from 'antd';
import { FC, memo, useState } from 'react';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';

import { RewardsStatistic } from '../styles';
import { useClaimableIncentives } from './rewards';

type PendingReward = { reward: bigint; topUp: bigint };

type RewardsColumnProps = { title: string; statistic: null | string; loading?: boolean };

const RewardColumn: FC<RewardsColumnProps> = ({ title, statistic, loading }) => (
  <Col span={24} xl={12}>
    <RewardsStatistic title={title} value={statistic || '--'} loading={!!loading} />
  </Col>
);

type RewardsSectionProps = {
  ownerAddress: string;
  id: string;
  type: string;
};

export const RewardsSection: FC<RewardsSectionProps> = memo(function RewardsSection({
  ownerAddress,
  id,
  type,
}) {
  const [pendingIncentives, setPendingIncentives] = useState<PendingReward | null>(null);

  const {
    isFetching,
    reward: claimableReward,
    topUp: claimableTopup,
  } = useClaimableIncentives(ownerAddress, type, id);

  return (
    <Flex gap={4} vertical>
      <Flex vertical gap={4}>
        <Row>
          <RewardColumn
            title="Claimable Reward"
            statistic={claimableReward ? `${claimableReward} ETH` : null}
            loading={isFetching}
          />
          <RewardColumn
            title="Claimable Top Up"
            statistic={claimableTopup ? `${claimableTopup} OLAS` : null}
          />
        </Row>
      </Flex>

      <Flex vertical gap={4}>
        <Row>
          <RewardColumn
            title="Pending Reward"
            statistic={pendingIncentives ? `${pendingIncentives?.reward} ETH` : null}
          />
          <RewardColumn
            title="Pending Top Up"
            statistic={pendingIncentives ? `${pendingIncentives?.topUp} OLAS` : null}
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
