import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card as CardAntd, Space, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Link from 'next/link';

import { StakingContract } from 'store/govern';
import { useAppSelector } from 'store/index';
import styled from 'styled-components';

import { CHAIN_NAMES } from 'common-util/functions';

const { Title, Paragraph, Text } = Typography;

const Card = styled(CardAntd)`
  flex: auto;
`;

// TODO: organize shared types
type Allocation = Pick<StakingContract, 'address' | 'chainId' | 'metadata'> & { weight: number };

type ContractsListProps = {
  isUpdating: boolean;
  handleAdd: (contract: StakingContract) => void;
  allocations: Allocation[];
};

const getColumns = ({
  handleAdd,
  allocations,
  actionsVisible,
}: Omit<ContractsListProps, 'isUpdating'> & {
  actionsVisible: boolean;
}): ColumnsType<StakingContract> => {
  const columns: ColumnsType<StakingContract> = [
    {
      title: 'Staking contract',
      key: 'name',
      render: (_, record) => (
        <Space size={2} direction="vertical">
          <Link href={`/contracts/${record.address}`}>{record.metadata?.name}</Link>
          <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId}</Text>
        </Space>
      ),
      width: actionsVisible ? 420 : 520,
    },
    {
      title: 'Current weight',
      key: 'currentWeight',
      // TODO: replace .toFixed(2) with something smarter
      render: (_, record) => (
        <Space size={2} direction="vertical">
          <Text>{`${record.currentWeight?.percentage.toFixed(2)}%`}</Text>
          <Text type="secondary">{`${record.currentWeight?.value.toFixed(2)} veOlas`}</Text>
        </Space>
      ),
    },
    {
      title: 'Next week weight',
      key: 'nextWeight',
      // TODO: replace .toFixed(2) with something smarter
      render: (_, record) => (
        <Space size={2} direction="vertical">
          <Text>{`${record.nextWeight?.percentage.toFixed(2)}%`}</Text>
          <Text type="secondary">{`${record.nextWeight?.value.toFixed(2)} veOlas`}</Text>
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
          <>
            <div />
            <Button
              icon={isAdded ? <CheckOutlined /> : <PlusOutlined />}
              type="primary"
              ghost
              size="small"
              onClick={() => handleAdd(record)}
              disabled={isAdded}
            >
              {isAdded ? 'Added' : 'Add'}
            </Button>
          </>
        );
      },
    });
  }

  return columns;
};

export const ContractsList = ({ isUpdating, handleAdd, allocations }: ContractsListProps) => {
  const { account } = useAppSelector((state) => state.setup);
  const { stakingContracts, isStakingContractsLoading } = useAppSelector((state) => state.govern);

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
          actionsVisible: isUpdating && !!account,
        })}
        dataSource={stakingContracts}
        pagination={false}
        loading={isStakingContractsLoading}
      />
    </Card>
  );
};
