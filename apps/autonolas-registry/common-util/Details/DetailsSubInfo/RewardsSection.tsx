import { Button, Flex, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';

import { getPendingIncentives, useClaimableIncentives } from 'libs/common-contract-functions/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';
import { TOKENOMICS } from 'libs/util-contracts/src';
import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { getEthersProviderForEthereum, getTokenomicsEthersContract } from 'common-util/Contracts';
import { claimOwnerIncentivesRequest } from 'common-util/functions/requests';
import { useHelpers } from 'common-util/hooks';

import { getTokenomicsUnitType } from './utils';

const { Text } = Typography;

type RewardsSectionProps = {
  ownerAddress: Address;
  id: string;
  type: string;
  dataTestId: string;
};

type DataSourceItem = {
  id: 'claimable' | 'pending';
  label: string;
  donations: string;
  topUps: string;
};
const getColumns = (
  canClaim: boolean,
  handleClaim: () => void,
  isClaimLoading: boolean,
): ColumnsType<DataSourceItem> => [
  {
    title: 'Type',
    key: 'type',
    dataIndex: 'label',
    render: (label, { id }) => (
      <Flex gap={16} align="center">
        <Text>{label}</Text>
        {id === 'claimable' && canClaim && (
          <Button type="primary" onClick={handleClaim} loading={isClaimLoading}>
            Claim
          </Button>
        )}
      </Flex>
    ),
    width: '40%',
  },
  {
    title: 'Donations',
    key: 'donations',
    dataIndex: 'donations',
    render: (donations) => <Text>{`${donations} ETH`}</Text>,
  },
  {
    title: 'Top Ups',
    key: 'topUps',
    dataIndex: 'topUps',
    render: (topUps) => <Text>{`${topUps} OLAS`}</Text>,
  },
];

export const RewardsSection: FC<RewardsSectionProps> = ({ ownerAddress, id, type, dataTestId }) => {
  const { account } = useHelpers();

  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [isPendingIncentivesLoading, setIsPendingIncentivesLoading] = useState<boolean>(true);
  const [pendingIncentives, setPendingIncentives] = useState<{
    pendingReward: string;
    pendingTopUp: string;
  } | null>(null);

  const tokenomicsUnitType = getTokenomicsUnitType(type);

  const {
    reward: claimableReward,
    rewardEth: claimableRewardEth,
    topUp: claimableTopUp,
    topUpEth: claimableTopUpEth,
    isFetching: isClaimableIncentivesLoading,
    refetch,
  } = useClaimableIncentives(
    TOKENOMICS.addresses[1],
    TOKENOMICS.abi,
    ownerAddress,
    id,
    tokenomicsUnitType,
  );

  const fetchPendingIncentives = useCallback(async () => {
    const provider = getEthersProviderForEthereum();
    const contract = getTokenomicsEthersContract(TOKENOMICS.addresses[1]);

    try {
      const incentives = await getPendingIncentives({
        provider,
        contract,
        unitType: `${tokenomicsUnitType}`,
        unitId: id,
      });
      setPendingIncentives(incentives);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPendingIncentivesLoading(false);
    }
  }, [tokenomicsUnitType, id]);

  useEffect(() => {
    fetchPendingIncentives();
  }, [fetchPendingIncentives]);

  const rewards = useMemo(() => {
    if (isClaimableIncentivesLoading || isPendingIncentivesLoading) return [];
    if (claimableReward == undefined || claimableTopUp === undefined || pendingIncentives === null)
      return [];

    return [
      {
        id: 'claimable',
        label: 'Claimable',
        donations: claimableReward,
        topUps: claimableTopUp,
      },
      {
        id: 'pending',
        label: 'Pending, next epoch',
        donations: pendingIncentives.pendingReward,
        topUps: pendingIncentives.pendingTopUp,
      },
    ] as DataSourceItem[];
  }, [
    isClaimableIncentivesLoading,
    isPendingIncentivesLoading,
    claimableReward,
    claimableTopUp,
    pendingIncentives,
  ]);

  const canClaim = useMemo(() => {
    if (account !== ownerAddress) return false;
    if (claimableRewardEth === undefined || claimableTopUpEth === undefined) return false;

    return claimableRewardEth > 0 || claimableTopUpEth > 0;
  }, [account, ownerAddress, claimableRewardEth, claimableTopUpEth]);

  const handleClaim = useCallback(async () => {
    if (!account) return;
    if (!canClaim) return;

    try {
      setIsClaimLoading(true);
      const params = {
        account: account as Address,
        unitIds: [id],
        unitTypes: [id],
      };

      await claimOwnerIncentivesRequest(params);
      notifySuccess('Rewards claimed');
      refetch();
      fetchPendingIncentives();
    } catch (error) {
      notifyError();
      console.error(error);
    } finally {
      setIsClaimLoading(false);
    }
  }, [account, id, canClaim, fetchPendingIncentives, refetch]);

  return (
    <Flex gap={16} vertical className="mt-12" data-testid={dataTestId}>
      <Table
        columns={getColumns(canClaim, handleClaim, isClaimLoading)}
        dataSource={rewards}
        loading={isClaimableIncentivesLoading || isPendingIncentivesLoading}
        pagination={false}
        style={{ maxWidth: '550px' }}
      />
      <a href="https://tokenomics.olas.network/donate">
        Make donation {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
    </Flex>
  );
};
