import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card as CardAntd, Space, Table, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';
import { Allocation, StakingContract } from 'types';
import { useAccount } from 'wagmi';

import { CHAIN_NAMES } from 'libs/util-constants/src';
import { formatUtcTimestamp, formatWeiNumber } from 'libs/util-functions/src';

import { NextWeekTooltip } from 'components/NextWeekTooltip';
import { useVotingPower } from 'hooks/useVotingPower';
import { useAppSelector } from 'store/index';

const { Title, Paragraph, Text } = Typography;

const Card = styled(CardAntd)`
  flex: auto;
`;

type ContractsListProps = {
  isUpdating: boolean;
  handleAdd: (contract: StakingContract) => void;
  allocations: Allocation[];
  /** Snapshot pre-rendered by `getStaticProps`, so the table ships as HTML. */
  initialContracts?: StakingContract[];
  /** When that snapshot was taken (ISO-8601 UTC), or null if the fetch failed. */
  snapshotGeneratedAt?: string | null;
};

const getColumns = ({
  handleAdd,
  allocations,
  actionsVisible,
  actionsDisabled,
}: Omit<ContractsListProps, 'isUpdating' | 'initialContracts' | 'snapshotGeneratedAt'> & {
  actionsVisible: boolean;
  actionsDisabled: boolean;
}): ColumnsType<StakingContract> => {
  const columns: ColumnsType<StakingContract> = [
    {
      title: 'Staking contract',
      key: 'name',
      width: actionsVisible ? 420 : 520,
      render: (_, record) => (
        <Space size={2} direction="vertical">
          {record.metadata?.name ? (
            <a href={`/contracts/${record.address}`} target="_blank">
              {record.metadata?.name}
            </a>
          ) : (
            'NA'
          )}

          <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId}</Text>
        </Space>
      ),
    },
    {
      title: 'Current weight',
      key: 'currentWeight',
      dataIndex: 'currentWeight',
      render: (currentWeight) => (
        <Space size={2} direction="vertical">
          <Text>{`${formatWeiNumber({
            value: currentWeight?.percentage,
            maximumFractionDigits: 3,
          })}%`}</Text>
          <Text type="secondary">{`${formatWeiNumber({
            value: currentWeight?.value,
            maximumFractionDigits: 3,
          })} veOLAS`}</Text>
        </Space>
      ),
    },
    {
      title: <NextWeekTooltip>Next week&apos;s weight</NextWeekTooltip>,
      key: 'nextWeight',
      dataIndex: 'nextWeight',
      render: (nextWeight) => (
        <Space size={2} direction="vertical">
          <Text>{`${formatWeiNumber({
            value: nextWeight?.percentage,
            maximumFractionDigits: 3,
          })}%`}</Text>
          <Text type="secondary">{`${formatWeiNumber({
            value: nextWeight?.value,
            maximumFractionDigits: 3,
          })} veOLAS`}</Text>
        </Space>
      ),
    },
  ];

  if (actionsVisible) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isAdded = !!allocations.find((item) => item.address === record.address);
        return (
          <Button
            icon={isAdded ? <CheckOutlined /> : <PlusOutlined />}
            type="primary"
            ghost
            onClick={() => handleAdd(record)}
            disabled={isAdded || actionsDisabled}
          >
            {isAdded ? 'Added' : 'Add'}
          </Button>
        );
      },
      width: 140,
    });
  }

  return columns;
};

export const ContractsList = ({
  isUpdating,
  handleAdd,
  allocations,
  initialContracts = [],
  snapshotGeneratedAt = null,
}: ContractsListProps) => {
  const { address: account } = useAccount();
  const { data: votingPower, isFetching: isVotingPowerLoading } = useVotingPower(account);
  const { stakingContracts, isStakingContractsLoading } = useAppSelector((state) => state.govern);

  // The store is empty during the server render and on the first client render, so fall back to
  // the pre-rendered snapshot. `hasClientSettled` is set from an effect, which never runs on the
  // server and runs only after the first client render, so that first render still matches the
  // server markup. Once the client has settled we trust it even when it returns nothing, or a
  // genuinely empty list would leave the stale snapshot on screen forever.
  // Only settle once loading has been observed to start and then finish: settling on an initial
  // all-false reading would drop the snapshot permanently and flash an empty table.
  const hasStartedLoading = useRef(false);
  const [hasClientSettled, setHasClientSettled] = useState(false);
  useEffect(() => {
    if (isStakingContractsLoading) {
      hasStartedLoading.current = true;
    } else if (hasStartedLoading.current) {
      setHasClientSettled(true);
    }
  }, [isStakingContractsLoading]);

  const contracts =
    hasClientSettled || stakingContracts.length > 0 ? stakingContracts : initialContracts;
  const asOf = formatUtcTimestamp(snapshotGeneratedAt);

  const isActionsDisabled = !account || isVotingPowerLoading || Number(votingPower) === 0;

  return (
    <Card>
      <Title level={3} className="m-0">
        All staking contracts
      </Title>
      <Paragraph type="secondary" className="mt-8">
        Decide which staking contracts receive the most incentives, attract the most AI agents, and
        grow.
      </Paragraph>
      {/* Hidden scope-and-provenance line: pre-rendered HTML is read long after it was built, so
          the weights below need to say what they measure and when they were taken. Hidden, not
          visible — the visible design is unchanged. */}
      {contracts.length > 0 && (
        <p className="sr-only">
          {`Olas staking contracts registered for emissions: ${contracts.length} contracts. For each one this table publishes its current voting weight, both in veOLAS and as a percentage of all emissions, and the weight it is on track to hold next week. `}
          {!hasClientSettled && asOf
            ? `Figures are a server-rendered snapshot taken ${asOf}; the running app refreshes them from chain.`
            : 'Figures are read live from chain in the browser.'}
        </p>
      )}
      <Table
        columns={getColumns({
          handleAdd,
          allocations,
          actionsVisible: isUpdating || isActionsDisabled,
          actionsDisabled: isActionsDisabled,
        })}
        dataSource={contracts}
        pagination={false}
        loading={isStakingContractsLoading && contracts.length === 0}
        rowKey={(record) => record.address}
        locale={{
          emptyText: (
            <Paragraph type="secondary" className="m-0">
              No staking contract data is available right now. When it loads, each contract in this
              table lists its name, the chain it runs on, its current voting weight in veOLAS and as
              a share of all emissions, and the weight it is on track to hold next week.
            </Paragraph>
          ),
        }}
      />
    </Card>
  );
};
