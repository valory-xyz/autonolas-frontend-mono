import {
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  TableOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Flex,
  InputNumber,
  Modal,
  Space,
  Table,
  Typography,
  notification,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useState } from 'react';

import { StakingContract } from 'store/govern';
import { useAppSelector } from 'store/index';
import styled from 'styled-components';

import { CHAIN_NAMES, voteForNomineeWeights } from 'common-util/functions';

const { Title, Paragraph, Text } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

const getColumns = (
  isUpdating: boolean,
  totalSupply: string,
  onAdd: (contract: StakingContract) => void,
  allocations: Allocation[],
): ColumnsType<StakingContract> => {
  const columns: ColumnsType<StakingContract> = [
    {
      title: 'Staking contract',
      key: 'name',
      render: (_, record) => (
        <Space size={2} direction="vertical">
          <Link href={`/contracts/${record.address}`}>{record.name}</Link>
          <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId}</Text>
        </Space>
      ),
    },
    {
      title: 'Current weight',
      key: 'currentWeight',
      render: (_, record) => (
        <Space size={2} direction="vertical">
          <Text>--</Text>
          <Text type="secondary">{`${record.currentWeight || (0).toFixed(2)}%`}</Text>
        </Space>
      ),
    },
    {
      title: 'Updated weight',
      key: 'nextWeight',
      render: (_, record) => (
        <Space size={2} direction="vertical">
          <Text>--</Text>
          <Text type="secondary">{`${record.nextWeight || (0).toFixed(2)}%`}</Text>
        </Space>
      ),
    },
  ];
  if (isUpdating) {
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
              onClick={() => onAdd(record)}
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

const getColumnsUpdating = (
  allocations: Allocation[],
  setAllocation: (value: number, index: number) => void,
  removeAllocation: (index: number) => void,
): ColumnsType<Allocation> => [
  {
    title: 'Contract name',
    key: 'name',
    render: (_, record) => <Text>{record.name}</Text>,
    width: 200,
  },
  {
    title: 'Chain',
    key: 'chain',
    render: (_, record) => (
      <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId}</Text>
    ),
    width: 120,
  },
  {
    title: 'My voting weight',
    key: 'weight',
    render: (_, record, index) => (
      <Flex gap={16}>
        <InputNumber
          addonAfter="%"
          min={0}
          max={100}
          step={0.01}
          value={allocations[index].weight}
          onChange={(value) => {
            if (value) {
              setAllocation(value, index);
            }
          }}
        />
        <Button
          icon={<DeleteOutlined />}
          onClick={() => removeAllocation(index)}
          style={{ flex: 'none' }}
        />
      </Flex>
    ),
    width: 140,
  },
];

const getColumnsUpdated = (allocations: Allocation[]): ColumnsType<Allocation> => [
  {
    title: 'Staking contract',
    key: 'name',
    render: (_, record) => (
      <Space size={2} direction="vertical">
        <Link href={`/contracts/${record.address}`}>{record.name}</Link>
        <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId}</Text>
      </Space>
    ),
    width: 200,
  },
  {
    title: 'Current weight',
    key: 'weight',
    render: (_, record) => <Text>{`${0}%`}</Text>,
    width: 120,
  },
  {
    title: 'Updated weight',
    key: 'updatedWeight',
    render: (_, record) => <Text>{`${record.weight}%`}</Text>,
    width: 140,
  },
];

type Allocation = {
  address: StakingContract['address'];
  name: StakingContract['name'];
  chainId: StakingContract['chainId'];
  weight: number;
};
export const AllocationPage = () => {
  const { stakingContracts, totalSupply } = useAppSelector((state) => state.govern);
  const { account } = useAppSelector((state) => state.setup);

  const [isUpdating, setIsUpdating] = useState(false);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isUpdated, setIsUpdated] = useState(false);

  const onAdd = (contract: StakingContract) => {
    setAllocations((prev) => [
      ...prev,
      {
        address: contract.address,
        name: contract.name,
        chainId: contract.chainId,
        weight: 0,
      },
    ]);
  };

  const onCancel = () => {
    setAllocations([]);
    setIsUpdating(false);
  };

  const updateAllocation = (value: number, index: number) => {
    setAllocations((prev) => {
      const newAllocations = [...prev];
      newAllocations[index] = { ...newAllocations[index], weight: value };
      return newAllocations;
    });
  };

  const removeAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPower = allocations.reduce((sum, item) => (sum * 100 + item.weight * 100) / 100, 0);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const updateVotingWeight = () => {
    setIsLoading(true);
    const nominees: string[] = [];
    const chainIds: string[] = [];
    const weights: string[] = [];
    allocations.forEach((item) => {
      nominees.push(item.address);
      chainIds.push(item.chainId);
      weights.push(`${Math.floor(item.weight * 100)}`);
    });
    voteForNomineeWeights({ account, nominees, chainIds, weights })
      .then(() => {
        setIsUpdated(true);
        closeModal()
        notification.success({
          message: "Your votes have been updated",
        });
      })
      .catch((error) => {
        notification.error({
          message: error.message,
        });
      }).finally(() => {
        setIsUpdating(false);
        setIsLoading(false);
      });
  };

  return (
    <StyledMain>
      <Flex gap={24}>
        <Card style={{ flex: 'auto' }}>
          <Title level={3} style={{ margin: '0 0 8px' }}>
            All staking contracts
          </Title>
          <Paragraph type="secondary">Relevant description.</Paragraph>
          <Alert
            message="Updated voting weights will take effect at the start of next week."
            showIcon
            type="info"
            style={{ margin: '24px 0' }}
          />
          <Table
            columns={getColumns(isUpdating, totalSupply, onAdd, allocations)}
            dataSource={stakingContracts}
            pagination={false}
          />
        </Card>
        <Card style={{ flex: 'none', height: 'max-content' }}>
          <Title level={4} style={{ margin: 0 }}>
            My voting weight
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 24px' }}>
            Allocate your voting power to direct OLAS emissions to different staking contracts.
          </Paragraph>

          {totalPower > 100 && (
            <Alert
              message="Total voting power entered must not exceed 100%"
              showIcon
              type="error"
              style={{ margin: '24px 0' }}
            />
          )}
          <Text>Voting power used</Text>
          <Flex gap={16} justify="space-between" align="center">
            <Text style={{ color: '#1F2229', fontSize: '24px', fontWeight: '700' }}>
              {`${totalPower}%`}
            </Text>
            {isUpdated && (
              <Flex gap={16} align="center">
                <Text style={{ color: '#4D596A' }}>
                  {' '}
                  <InfoCircleOutlined />
                  &nbsp; 9d 23h 59m
                </Text>
                <Button type="primary" disabled={true}>
                  Update voting weight
                </Button>
              </Flex>
            )}
          </Flex>
          <Space size={'small'} direction="vertical"></Space>
          {isUpdating ? (
            <>
              {allocations.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    alignItems: 'center',
                    marginBottom: '32px',
                  }}
                >
                  <TableOutlined style={{ fontSize: '56px', color: '#A3AEBB' }} />
                  <Paragraph style={{ color: '#4D596A', textAlign: 'center' }}>
                    You haven’t voted for any staking contracts yet.
                    <br />
                    Start by adding contracts from the section on the left
                  </Paragraph>
                </div>
              ) : (
                <Table
                  style={{ margin: '16px 0 24px' }}
                  columns={getColumnsUpdating(allocations, updateAllocation, removeAllocation)}
                  dataSource={allocations}
                  pagination={false}
                />
              )}
              <Flex gap={12} justify="flex-end">
                <Button onClick={onCancel}>Cancel</Button>
                <Button
                  type="primary"
                  onClick={showModal}
                  disabled={allocations.length === 0 || totalPower === 0 || totalPower > 100}
                >
                  Update voting weight
                </Button>
              </Flex>
              <Modal
                title="Confirm voting weight update"
                open={isModalOpen}
                onOk={updateVotingWeight}
                onCancel={closeModal}
                cancelText="Cancel"
                okText="Confirm voting weight"
                confirmLoading={isLoading}
              >
                <p style={{ color: '#4D596A' }}>
                  Your are going to vote <b style={{ color: '#000' }}>{totalPower}%</b> of your
                  voting power for <b style={{ color: '#000' }}>{allocations.length}</b> staking
                  contract{allocations.length > 1 && 's'}. New voting weight will take effect at the
                  beginning of the next week.
                </p>
                <p style={{ color: '#4D596A' }}>
                  Note that after you submit your voting weights, you won’t be able to update it or
                  add new contracts to vote <b style={{ color: '#000' }}>for the next 10 days.</b>
                </p>
                <Checkbox style={{ marginBottom: '12px' }}>Don’t show this message again</Checkbox>
              </Modal>
            </>
          ) : isUpdated ? (
            <>
              <Table
                style={{ margin: '16px 0 24px' }}
                columns={getColumnsUpdated(allocations)}
                dataSource={allocations}
                pagination={false}
              />
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <TableOutlined style={{ fontSize: '56px', color: '#A3AEBB' }} />
              <Paragraph style={{ color: '#4D596A', textAlign: 'center' }}>
                You haven’t voted for any staking contracts yet.
              </Paragraph>
              <Button type="primary" onClick={() => setIsUpdating(() => true)}>
                Add contracts to vote
              </Button>
            </div>
          )}
        </Card>
      </Flex>
    </StyledMain>
  );
};
