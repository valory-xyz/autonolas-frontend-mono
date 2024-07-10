// import { useClaimableIncentives } from '@autonolas-frontend-mono/common-contract-functions';
import { Col, Flex, Row } from 'antd';
import { FC, useEffect, useState } from 'react';

import { useClaimableIncentives } from 'libs/common-contract-functions/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';

import { RewardsStatistic } from '../styles';
import { useTokenomicsUnitType } from './hooks';
import { getPendingIncentives, usePendingIncentives } from './rewards';

// import { useClaimableIncentives } from './rewards';

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
  dataTestId: string;
};

export const RewardsSection: FC<RewardsSectionProps> = ({ ownerAddress, id, type, dataTestId }) => {
  const [pendingIncentives, setPendingIncentives] = useState<PendingReward | null>(null);

  // usePendingIncentives(type, id);

  const tokenomicsUnitType = useTokenomicsUnitType(type);
  const {
    isFetching,
    reward: claimableReward,
    topUp: claimableTopup,
  } = useClaimableIncentives(ownerAddress, id, tokenomicsUnitType);

  useEffect(() => {
    const data = getPendingIncentives(`${tokenomicsUnitType}`, id);
    // setPendingIncentives(data);
    console.log(data);
  }, [ownerAddress, id, tokenomicsUnitType]);

  return (
    <Flex gap={4} vertical data-testid={dataTestId}>
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
};
