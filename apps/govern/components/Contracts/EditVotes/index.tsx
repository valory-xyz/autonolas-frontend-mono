import { DeleteOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, InputNumber, Table, Typography, notification } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import styled from 'styled-components';
import { Allocation } from 'types';
import { Address } from 'viem';
import { useAccount } from 'wagmi';

import { CHAIN_NAMES, RETAINER_ADDRESS } from 'libs/util-constants/src';

import { INVALIDATE_AFTER_UPDATE_KEYS } from 'common-util/constants/scopeKeys';
import { voteForNomineeWeights } from 'common-util/functions/requests';
import { useAppDispatch, useAppSelector } from 'store/index';

import { ConfirmModal } from './ConfirmModal';
import { MAX_ALLOCATED_POWER, getReorderedVotes } from './utils';
import {
  checkLockNotExpired,
  checkNoDisabledContracts,
  checkNoRemovedNominees,
  checkNotNegativeSlope,
} from './validations';
import { resetState } from 'common-util/functions/resetState';
import { getBytes32FromAddress } from 'libs/util-functions/src';

const { Paragraph, Text } = Typography;

const TotalAllocatedPower = styled(Text)`
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  margin-bottom: 16px;
`;

type EditVotesProps = {
  allocations: Allocation[];
  setAllocations: Dispatch<SetStateAction<Allocation[]>>;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
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
    dataIndex: 'metadata',
    render: (metadata) => <Text strong>{metadata?.name || 'NA'}</Text>,
    width: 200,
  },
  {
    title: 'Chain',
    key: 'chain',
    dataIndex: 'chainId',
    render: (chainId) => <Text type="secondary">{CHAIN_NAMES[chainId] || chainId}</Text>,
    width: 80,
  },
  {
    title: 'My voting weight',
    key: 'weight',
    render: (_, _record, index) => (
      <Flex gap={16}>
        <InputNumber
          addonAfter="%"
          min={0}
          max={100}
          step={0.01}
          controls={false}
          value={allocations[index].weight}
          status={isError ? 'error' : undefined}
          onChange={(value) => {
            if (typeof value === 'number') {
              setAllocation(value, index);
            }
          }}
          data-testid={`my-voting-weight-input-${index}`}
        />
        <Button
          size="large"
          icon={<DeleteOutlined />}
          onClick={() => removeAllocation(index)}
          style={{ flex: 'none' }}
          data-testid={`remove-allocation-button-${index}`}
        />
      </Flex>
    ),
    width: 180,
  },
];

export const EditVotes = ({ allocations, setAllocations, setIsUpdating }: EditVotesProps) => {
  const dispatch = useAppDispatch();
  const { address: account } = useAccount();
  const { userVotes, stakingContracts } = useAppSelector((state) => state.govern);

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

  // Sum of allocated weights, where 1% is represented as 100 (100% = 10,000)
  const allocatedPower = allocations.reduce((sum, item) => sum + item.weight * 100, 0);
  const isError = allocatedPower > MAX_ALLOCATED_POWER;

  const showModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const updateVotingWeight = useCallback(async () => {
    if (!account) return;
    if (allocatedPower > MAX_ALLOCATED_POWER) return;

    setIsLoading(true);

    // Validations
    if (
      !(await checkNoRemovedNominees(allocations)) ||
      !(await checkNoDisabledContracts(allocations)) ||
      !(await checkNotNegativeSlope(account)) ||
      !(await checkLockNotExpired(account))
    ) {
      setIsLoading(false);
      return;
    }

    const allocationsWithRetainer = [...allocations];
    // If not all weight was used, allocate the rest to the retainer
    if (allocatedPower < MAX_ALLOCATED_POWER) {
      allocationsWithRetainer.push({
        address: getBytes32FromAddress(RETAINER_ADDRESS),
        chainId: 1,
        weight: (MAX_ALLOCATED_POWER - allocatedPower) / 100,
        metadata: { name: 'n/a', description: 'n/a' },
      });
    }

    const votes = getReorderedVotes(allocationsWithRetainer, userVotes, stakingContracts);

    const nominees: Address[] = [];
    const chainIds: number[] = [];
    const weights: string[] = [];

    votes.forEach((vote) => {
      nominees.push(vote.address);
      chainIds.push(vote.chainId);
      weights.push(vote.weight);
    });

    // Proceed with voting if everything is okay
    voteForNomineeWeights({ account, nominees, chainIds, weights })
      .then(() => {
        closeModal();
        notification.success({
          message: 'Your votes have been updated',
        });

        setIsUpdating(false);

        resetState(INVALIDATE_AFTER_UPDATE_KEYS, dispatch);
      })
      .catch((error) => {
        notification.error({
          message: error.message,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [account, allocations, dispatch, stakingContracts, allocatedPower, userVotes, setIsUpdating]);

  const totalAllocatedPower = parseFloat((allocatedPower / 100).toFixed(2));

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
      <TotalAllocatedPower data-testid="total-allocated-power">{`${totalAllocatedPower}%`}</TotalAllocatedPower>

      <Table
        className="mt-16 mb-16"
        columns={getColumns(allocations, updateAllocation, removeAllocation, isError)}
        dataSource={allocations}
        pagination={false}
        rowKey={(record) => record.address}
      />

      <Paragraph type="secondary" className="text-end">
        Updated voting weights will take effect at the start of next week (according to Unix time).
      </Paragraph>
      <Flex gap={12} justify="flex-end">
        <Button size="large" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="large"
          type="primary"
          onClick={showModal}
          disabled={allocations.length === 0 || allocatedPower === 0 || isError}
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
        allocatedPower={allocatedPower}
      />
    </>
  );
};
