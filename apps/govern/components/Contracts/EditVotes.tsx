import { DeleteOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Flex,
  InputNumber,
  Modal,
  Table,
  Typography,
  message,
  notification,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Address, Allocation, StakingContract, UserVotes } from 'types/index';

import { clearState } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';
import styled from 'styled-components';

import { RETAINER_ADDRESS } from 'common-util/constants/addresses';
import { INVALIDATE_AFTER_UPDATE_KEYS } from 'common-util/constants/scopeKeys';
import {
  CHAIN_NAMES,
  checkIfContractDisabled,
  checkIfNomineeRemoved,
  checkLockExpired,
  checkNegativeSlope,
  getBytes32FromAddress,
  voteForNomineeWeights,
} from 'common-util/functions';

import { queryClient } from '../../context/Web3ModalProvider';

const { Paragraph, Text } = Typography;

const getRemovedNomineesError = (removedNominees: Address[], allocations: Allocation[]) => (
  <Flex align="start" vertical>
    <Paragraph className="m-0">Some of the contracts are no longer available for voting.</Paragraph>
    <Paragraph>Remove them and try again:</Paragraph>
    <ul>
      {removedNominees.map((item) => (
        <li key={item} className="text-start">
          <b>{allocations.find((contract) => contract.address === item)?.metadata.name}</b>
        </li>
      ))}
    </ul>
  </Flex>
);

const NO_VEOLAS_ERROR = `You don't have enough veOLAS to vote`;

/**
 * BE stores and checks the user's limit (which is 10_000 = 100%)
 * every time we vote on a contract.
 *
 * Example:
 * The old votes are: [{2: 8000}, {3: 1000}, {5: 1000}] - the user's total vote is 10_000.
 * The new votes are: [{1: 3000}, {2: 1000}, {5: 6000}]
 *
 * The first new vote is 3000, which exceeds the limit of 10,000, causing an Overflow error.
 * To prevent this, we need to reorder the old and new votes as follows:
 * [{3: 0}, {2: 1000}, {5: 6000}, {1: 3000}]
 *
 * First, we need to remove weights from the contracts that the user is no longer voting on.
 * Then, if the user votes on the same contracts as before, we should place the new weights,
 * sorted by ascending weight, at the same positions as the old votes, sorted by descending weight
 * (So the applied new weight is lower that the old one).
 * Finally, we can add the remaining new votes.
 */
const getReorderedVotes = (
  allocations: Allocation[],
  userVotes: Record<string, UserVotes>,
  stakingContracts: StakingContract[],
) => {
  // Sort new allocation by ascending weights
  const sortedAllocations = [...allocations].sort((a, b) => a.weight - b.weight);
  // Sort old votes by descending weights
  const sortedOldVotes = [...Object.entries(userVotes)].sort(
    ([aKey, aValue], [bKey, bValue]) => bValue.current.power - aValue.current.power,
  );

  const newVotes: { address: Address; chainId: number; weight: string }[] = [];

  // Start from old votes
  sortedOldVotes.forEach((oldVote) => {
    const [oldVoteAddress] = oldVote;

    const newVote = sortedAllocations.find((item) => item.address === oldVoteAddress);
    // If the user votes for the same contract they already voted on,
    // keep new weight value at the same position of resorted old votes
    if (newVote) {
      newVotes.push({
        address: newVote.address,
        chainId: newVote.chainId,
        weight: `${Math.floor(newVote.weight * 100)}`,
      });
    } else {
      // Otherwise we need to remove weight from that contract
      // before voting on the others contacts
      const chainId = stakingContracts.find((item) => item.address === oldVoteAddress)?.chainId;
      if (chainId) {
        newVotes.unshift({ address: oldVoteAddress as Address, chainId, weight: '0' });
      }
    }
  });

  // Add remaining new votes to the result
  sortedAllocations.forEach((newVote) => {
    if (newVotes.findIndex((item) => item.address === newVote.address) === -1) {
      newVotes.push({
        address: newVote.address,
        chainId: newVote.chainId,
        weight: `${Math.floor(newVote.weight * 100)}`,
      });
    }
  });

  return newVotes;
};

const TotalPower = styled(Text)`
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
      <Paragraph>
        {`You're allocating ${parseFloat(
          (totalPower / 100).toFixed(2),
        )}% of your voting power to ${allocationsLength} staking contracts.`}
      </Paragraph>
      <Paragraph>
        {`After you confirm, you'll enter a 10 day cooldown period. You won't be able to update your weights during that time.`}
      </Paragraph>

      {totalPower < 10_000 && (
        <Alert
          // TODO: add blue info alerts as in Pearl
          className="mb-16"
          message={`${parseFloat(
            ((10_000 - totalPower) / 100).toFixed(2),
          )}% of your voting power is unallocated - this will be applied to the Rollover Pool and may be used in future epochs.`}
          showIcon
        />
      )}
    </Modal>
  );
};

export const EditVotes = ({ allocations, setAllocations, setIsUpdating }: EditVotesProps) => {
  const dispatch = useAppDispatch();
  const { account } = useAppSelector((state) => state.setup);
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

  const totalPower = allocations.reduce((sum, item) => sum + item.weight * 100, 0);
  const isError = totalPower > 10_000;

  const showModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const updateVotingWeight = useCallback(async () => {
    if (!account) return;
    if (totalPower > 10_000) return;

    setIsLoading(true);

    // Check if any of the nominees were removed from voting
    const removedNominees = await checkIfNomineeRemoved(allocations);
    if (removedNominees.length > 0) {
      message.error({
        content: getRemovedNomineesError(removedNominees, allocations),
        duration: 10,
      });
      setIsLoading(false);
      return;
    }

    // Check if any of the nominated contracts are disabled
    const disabledContracts = await checkIfContractDisabled(allocations);
    if (disabledContracts.length > 0) {
      message.error({
        content: getRemovedNomineesError(disabledContracts, allocations),
        duration: 10,
      });
      setIsLoading(false);
      return;
    }

    // Check negative slope
    const isNegativeSlope = await checkNegativeSlope(account);
    if (isNegativeSlope) {
      message.error(NO_VEOLAS_ERROR);
      setIsLoading(false);
      return;
    }

    // Check lock expired
    const isLockExpired = await checkLockExpired(account);
    if (isLockExpired) {
      message.error(NO_VEOLAS_ERROR);
      setIsLoading(false);
      return;
    }

    const allocationsWithRetainer = [...allocations];
    // If not all weight was used, allocate the rest to the retainer
    if (totalPower < 10_000) {
      allocationsWithRetainer.push({
        address: getBytes32FromAddress(RETAINER_ADDRESS),
        chainId: 1,
        weight: (10_000 - totalPower) / 100,
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
        // Reset previously saved data so it's re-fetched automatically
        queryClient.removeQueries({
          predicate: (query) =>
            INVALIDATE_AFTER_UPDATE_KEYS.includes(
              (query.queryKey[1] as Record<string, string>)?.scopeKey,
            ),
        });
        dispatch(clearState());
      })
      .catch((error) => {
        notification.error({
          message: error.message,
        });

        setIsUpdating(false);
        // Reset previously saved data so it's re-fetched automatically
        queryClient.removeQueries({
          predicate: (query) =>
            INVALIDATE_AFTER_UPDATE_KEYS.includes(
              (query.queryKey[1] as Record<string, string>)?.scopeKey,
            ),
        });
        dispatch(clearState());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [account, allocations, dispatch, stakingContracts, totalPower, userVotes, setIsUpdating]);

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
      <TotalPower>{`${parseFloat((totalPower / 100).toFixed(2))}%`}</TotalPower>
      <Table
        className="mt-16 mb-16"
        columns={getColumns(allocations, updateAllocation, removeAllocation, isError)}
        dataSource={allocations}
        pagination={false}
      />
      <Paragraph type="secondary" className="text-end">
        New voting weight will take effect at the beginning of the next week.
      </Paragraph>
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
