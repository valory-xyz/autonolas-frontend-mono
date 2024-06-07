import { DeleteOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  InputNumber,
  Modal,
  Table,
  Typography,
  notification,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Dispatch, SetStateAction, useState } from 'react';

import { StakingContract } from 'store/govern';
import { useAppSelector } from 'store/index';
import styled from 'styled-components';

import { CHAIN_NAMES, voteForNomineeWeights } from 'common-util/functions';

const { Paragraph, Text } = Typography;

const TotalPower = styled(Text)`
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  margin-bottom: 24px;
`;

type Allocation = StakingContract & { weight: number };

type EditVotesProps = {
  allocations: Allocation[];
  setAllocations: Dispatch<SetStateAction<Allocation[]>>;
};

const getColumns = (
  allocations: Allocation[],
  setAllocation: (value: number, index: number) => void,
  removeAllocation: (index: number) => void,
  isError: boolean,
): ColumnsType<Allocation> => [
  {
    title: 'Contract name',
    key: 'name',
    render: (_, record) => <Text strong>{record.metadata.name}</Text>,
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
          status={isError ? 'error' : undefined}
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

const ConfirmModal = ({
  isOpen,
  handleOk,
  handleClose,
  isLoading,
  allocationsLength,
  totalPower,
}: {
  isOpen: boolean;
  handleOk: () => void;
  handleClose: () => void;
  isLoading: boolean;
  allocationsLength: number;
  totalPower: number;
}) => {
  return (
    <Modal
      title="Confirm voting weight update"
      open={isOpen}
      onOk={handleOk}
      onCancel={handleClose}
      cancelText="Cancel"
      okText="Confirm voting weight"
      confirmLoading={isLoading}
    >
      <Paragraph type="secondary">
        Your are going to vote <Text strong>{totalPower}%</Text> of your voting power for{' '}
        <Text strong>{allocationsLength}</Text> staking contract
        {allocationsLength > 1 && 's'}. New voting weight will take effect at the beginning of the
        next week.
      </Paragraph>
      <Paragraph type="secondary">
        Note that after you submit your voting weights, you won’t be able to update it or add new
        contracts to vote <Text strong>for the next 10 days.</Text>
      </Paragraph>
      <Checkbox className="mb-16">Don’t show this message again</Checkbox>
    </Modal>
  );
};

export const EditVotes = ({ allocations, setAllocations }: EditVotesProps) => {
  const { account } = useAppSelector((state) => state.setup);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onCancel = () => setAllocations([]);

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
  const isError = totalPower > 100;

  const showModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const updateVotingWeight = () => {
    setIsLoading(true);
    const nominees: string[] = [];
    const chainIds: number[] = [];
    const weights: string[] = [];
    allocations.forEach((item) => {
      nominees.push(item.address);
      chainIds.push(item.chainId);
      weights.push(`${Math.floor(item.weight * 100)}`);
    });
    voteForNomineeWeights({ account, nominees, chainIds, weights })
      .then(() => {
        closeModal();
        notification.success({
          message: 'Your votes have been updated',
        });
      })
      .catch((error) => {
        notification.error({
          message: error.message,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      {isError && (
        <Alert
          className="mb-16"
          message="Total voting power entered must not exceed 100%"
          showIcon
          type="error"
        />
      )}
      <Text type="secondary" strong>
        Voting power used
      </Text>
      <TotalPower>{`${totalPower}%`}</TotalPower>
      <Table
        className="mt-16 mb-16"
        columns={getColumns(allocations, updateAllocation, removeAllocation, isError)}
        dataSource={allocations}
        pagination={false}
      />
      <Flex gap={12} justify="flex-end">
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          type="primary"
          onClick={showModal}
          disabled={allocations.length === 0 || totalPower === 0 || isError}
        >
          Update voting weight
        </Button>
      </Flex>
      <ConfirmModal
        isOpen={isModalOpen}
        handleOk={updateVotingWeight}
        handleClose={closeModal}
        isLoading={isLoading}
        allocationsLength={allocations.length}
        totalPower={totalPower}
      />
    </>
  );
};
