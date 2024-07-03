import { CheckOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card as CardAntd, Space, Table, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';
import { Allocation, StakingContract } from 'types';
import { useAccount } from 'wagmi';

import { COLOR } from '@autonolas/frontend-library';

import { CHAIN_NAMES } from 'libs/util-constants/src';

import { formatWeiBalance } from 'common-util/functions/balance';
import { useVotingPower } from 'hooks/useVotingPower';
import { useAppSelector } from 'store/index';

const { Title, Paragraph, Text } = Typography;

const NextWeekTitle = () => (
  <Tooltip
    color={COLOR.WHITE}
    title={<Text>Updated voting weights will take effect at the start of next week</Text>}
  >
    Next week weight <InfoCircleOutlined className="ml-8" style={{ color: COLOR.GREY_2 }} />
  </Tooltip>
);

const Card = styled(CardAntd)`
  flex: auto;
`;

type ContractsListProps = {
  isUpdating: boolean;
  handleAdd: (contract: StakingContract) => void;
  allocations: Allocation[];
};

const getColumns = ({
  handleAdd,
  allocations,
  actionsVisible,
  actionsDisabled,
}: Omit<ContractsListProps, 'isUpdating'> & {
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
          <Text>{`${currentWeight?.percentage.toFixed(2)}%`}</Text>
          <Text type="secondary">{`${formatWeiBalance(currentWeight?.value)} veOlas`}</Text>
        </Space>
      ),
    },
    {
      title: <NextWeekTitle />,
      key: 'nextWeight',
      dataIndex: 'nextWeight',
      render: (nextWeight) => (
        <Space size={2} direction="vertical">
          <Text>{`${nextWeight?.percentage.toFixed(2)}%`}</Text>
          <Text type="secondary">{`${formatWeiBalance(nextWeight?.value)} veOlas`}</Text>
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
            size="small"
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

export const ContractsList = ({ isUpdating, handleAdd, allocations }: ContractsListProps) => {
  const { address: account } = useAccount();
  const { data: votingPower, isFetching: isVotingPowerLoading } = useVotingPower(account);
  const { stakingContracts, isStakingContractsLoading } = useAppSelector((state) => state.govern);

  const isActionsDisabled = !account || isVotingPowerLoading || Number(votingPower) === 0;

  return (
    <Card>
      <Title level={3} className="m-0">
        All staking contracts
      </Title>
      <Paragraph type="secondary" className="mt-8">
        Decide which staking contracts receive the most incentives, attract the most agents, and
        grow.
      </Paragraph>
      <Table
        columns={getColumns({
          handleAdd,
          allocations,
          actionsVisible: isUpdating || isActionsDisabled,
          actionsDisabled: isActionsDisabled,
        })}
        dataSource={stakingContracts}
        pagination={false}
        loading={isStakingContractsLoading}
        rowKey={(record) => record.address}
      />
    </Card>
  );
};
