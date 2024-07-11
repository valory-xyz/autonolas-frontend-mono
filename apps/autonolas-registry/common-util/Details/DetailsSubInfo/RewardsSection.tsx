// import { useClaimableIncentives } from '@autonolas-frontend-mono/common-contract-functions';
import { Col, Flex, Row } from 'antd';
import { FC, useEffect, useState } from 'react';
import { Address } from 'viem';

import {
  PendingReward,
  getPendingIncentives,
  useClaimableIncentives,
} from 'libs/common-contract-functions/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';
import { TOKENOMICS } from 'libs/util-contracts/src';

import { getEthersProviderForEthereum, getTokenomicsEthersContract } from 'common-util/Contracts';

import { RewardsStatistic } from '../styles';
import { useTokenomicsUnitType } from './hooks';

type RewardsColumnProps = { title: string; statistic: null | string; loading?: boolean };

const RewardColumn: FC<RewardsColumnProps> = ({ title, statistic, loading }) => (
  <Col span={24} xl={12}>
    <RewardsStatistic title={title} value={statistic || '--'} loading={!!loading} />
  </Col>
);

type RewardsSectionProps = {
  ownerAddress: Address;
  id: string;
  type: string;
  dataTestId: string;
};

export const RewardsSection: FC<RewardsSectionProps> = ({ ownerAddress, id, type, dataTestId }) => {
  const [isPendingIncentivesLoading, setIsPendingIncentivesLoading] = useState<boolean>(true);
  const [pendingIncentives, setPendingIncentives] = useState<PendingReward | null>(null);

  const tokenomicsUnitType = useTokenomicsUnitType(type);
  const {
    isFetching,
    reward: claimableReward,
    topUp: claimableTopup,
  } = useClaimableIncentives(
    TOKENOMICS.addresses[1],
    TOKENOMICS.abi,
    ownerAddress,
    id,
    tokenomicsUnitType,
  );

  useEffect(() => {
    const provider = getEthersProviderForEthereum();
    const contract = getTokenomicsEthersContract(TOKENOMICS.addresses[1]);

    getPendingIncentives(provider, contract, `${tokenomicsUnitType}`, id)
      .then((data) => setPendingIncentives(data))
      .catch((error) => console.error(error))
      .finally(() => setIsPendingIncentivesLoading(false));
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
            loading={isPendingIncentivesLoading}
          />
          <RewardColumn
            title="Pending Top Up"
            statistic={pendingIncentives ? `${pendingIncentives?.topUp} OLAS` : null}
            loading={isPendingIncentivesLoading}
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
