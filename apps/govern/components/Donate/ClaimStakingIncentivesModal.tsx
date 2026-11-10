import { useMemo, useRef, useState } from 'react';
import { Button, Collapse, Flex, Modal, Space, Spin, Steps, Table, Tag, Typography } from 'antd';

import {
  formatWeiNumber,
  notifyError,
  notifySuccess,
  notifyWarning,
} from 'libs/util-functions/src';
import { useAppSelector } from 'store/index';
import { StakingContract } from 'types';
import { useClaimableNomineesBatches } from 'hooks/useClaimableNomineeBatches';
import { useClaimStakingIncentivesBatch } from 'hooks/useClaimStakingIncentivesBatch';
import type { ClaimError } from 'common-util/functions/staking-incentives-claim';

import { StakingIncentivesModalContainer } from './styles';

const { Text } = Typography;

const MODAL_WIDTH = 860;
const TABLE_SCROLL_HEIGHT = 420;
const STEP_CHANGE_DELAY = 1000;

const modalProps = {
  title: 'Claim Staking Incentives',
  open: true,
  width: MODAL_WIDTH,
  footer: null,
} as const;

const getSteps = (totalSteps: number) =>
  Array.from({ length: totalSteps }, (_, index) => ({
    title: `Batch ${index + 1}`,
    description: `Claim staking incentives batch #${index + 1}`,
  }));

const columns = [
  {
    title: 'Staking contract',
    dataIndex: 'metadata',
    render: (metadata: StakingContract['metadata']) => <Text>{metadata?.name}</Text>,
  },
  {
    title: 'Chain Id',
    dataIndex: 'chainId',
    width: 120,
  },
  {
    title: "Next Week's Weight",
    width: 200,
    dataIndex: 'nextWeight',
    render: (nextWeight: StakingContract['nextWeight']) => (
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

const notifyClaimError = (error: ClaimError, batchNumber: number) => {
  switch (error.kind) {
    case 'wallet-rejected':
      notifyWarning('Claim cancelled in your wallet');
      return;
    case 'nothing-to-claim':
      notifyWarning('Someone else claimed these incentives. Nothing is left to claim.');
      return;
    case 'claims-changed':
      notifyWarning(
        'Claims changed while preparing the transaction',
        'The list has been refreshed. Review it and claim again.',
      );
      return;
    case 'reverted-after-simulation':
      notifyError(
        `The claim for batch ${batchNumber} failed on-chain`,
        'The list has been refreshed. Claim again to sign a new transaction.',
      );
      return;
    case 'other':
      notifyError(`Failed to claim staking incentives for batch ${batchNumber}`, error.message);
  }
};

type ClaimStakingIncentivesModalProps = {
  onClose: () => void;
};

export const ClaimStakingIncentivesModal = ({ onClose }: ClaimStakingIncentivesModalProps) => {
  const [currentBatch, setCurrentBatch] = useState(0);
  const [claimedBatches, setClaimedBatches] = useState<number[]>([]);
  const { stakingContracts } = useAppSelector((state) => state.govern);

  const {
    nomineesToClaimBatches,
    isLoadingClaimableBatches,
    clearClaimableBatches,
    refetchClaimableBatches,
  } = useClaimableNomineesBatches();
  // A claim settles after its own render: a rebuild may have reset the batches meanwhile.
  const latest = useRef({ currentBatch, batchCount: nomineesToClaimBatches.length });
  latest.current = { currentBatch, batchCount: nomineesToClaimBatches.length };

  const { claimIncentivesForBatch, isPending, isPreparing } = useClaimStakingIncentivesBatch({
    onSuccess: () => {
      const { currentBatch: claimedBatch, batchCount } = latest.current;
      setClaimedBatches((prev) => [...prev, claimedBatch]);
      // Only move to next batch, if more batches are remaining.
      if (claimedBatch < batchCount - 1) {
        setTimeout(() => {
          setCurrentBatch((prev) => prev + 1);
        }, STEP_CHANGE_DELAY);
      }
      notifySuccess(`Staking incentives for batch ${claimedBatch + 1} claimed successfully`);
    },
    onError: (error) => {
      console.error(error);
      notifyClaimError(error, latest.current.currentBatch + 1);
    },
    refetchClaimableBatches,
    onBatchesRebuilt: () => {
      setCurrentBatch(0);
      setClaimedBatches([]);
    },
  });

  const nomineesForCurrentBatch = useMemo(() => {
    const [, currentBatchNomineesSubArray] = nomineesToClaimBatches?.[currentBatch] ?? [];
    if (!currentBatchNomineesSubArray) return [];
    return currentBatchNomineesSubArray
      .flat()
      .map((nomineeAddress) => {
        const nominee = stakingContracts.find((nominee) => nominee.address === nomineeAddress);
        if (!nominee) return null;
        return nominee;
      })
      .filter((nominee): nominee is StakingContract => nominee !== null);
  }, [currentBatch, nomineesToClaimBatches, stakingContracts]);

  const handleClose = () => {
    /* Clear claimable batches when the modal is closed, 
    this will ensure every time the modal is opened again it has the latest content. */
    clearClaimableBatches();
    onClose();
  };

  const handleClaimForBatch = () => claimIncentivesForBatch(nomineesToClaimBatches[currentBatch]);

  const isCurrentBatchClaimed = claimedBatches.includes(currentBatch);
  return (
    <Modal {...modalProps} onCancel={handleClose}>
      {nomineesToClaimBatches.length === 0 || isLoadingClaimableBatches ? (
        <EmptyModalContent isLoadingClaimableBatches={isLoadingClaimableBatches} />
      ) : (
        <ModalContent
          nomineesToClaimBatches={nomineesToClaimBatches}
          currentBatch={currentBatch}
          isCurrentBatchClaimed={isCurrentBatchClaimed}
          nomineesForCurrentBatch={nomineesForCurrentBatch}
          isPending={isPending}
          isPreparing={isPreparing}
          handleClaimForBatch={handleClaimForBatch}
        />
      )}
    </Modal>
  );
};

const EmptyModalContent = ({
  isLoadingClaimableBatches,
}: {
  isLoadingClaimableBatches: boolean;
}) => (
  <StakingIncentivesModalContainer $isEmpty>
    {isLoadingClaimableBatches && <Spin />}
    <Text style={{ fontSize: 18 }}>
      {isLoadingClaimableBatches
        ? 'Calculating which staking contracts can be claimed!'
        : 'All staking incentives were claimed this epoch.'}
    </Text>
  </StakingIncentivesModalContainer>
);

type ModalContentProps = {
  nomineesToClaimBatches: ReturnType<typeof useClaimableNomineesBatches>['nomineesToClaimBatches'];
  currentBatch: number;
  isCurrentBatchClaimed: boolean;
  nomineesForCurrentBatch: StakingContract[];
  isPending: boolean;
  isPreparing: boolean;
  handleClaimForBatch: () => void;
};

const ModalContent = ({
  nomineesToClaimBatches,
  currentBatch,
  isCurrentBatchClaimed,
  nomineesForCurrentBatch,
  isPending,
  isPreparing,
  handleClaimForBatch,
}: ModalContentProps) => (
  <StakingIncentivesModalContainer>
    <Steps
      size="small"
      items={getSteps(nomineesToClaimBatches.length)}
      current={currentBatch}
      direction="vertical"
    />

    <Flex vertical gap={16} style={{ width: '100%', padding: '0 16px' }}>
      {isCurrentBatchClaimed && (
        <div>
          <Tag color="success">Batch Claimed</Tag>
        </div>
      )}

      <Collapse
        items={[
          {
            key: '1',
            label: "Staking Contracts' Details",
            children: (
              <Table
                scroll={{ y: TABLE_SCROLL_HEIGHT }}
                columns={columns}
                dataSource={nomineesForCurrentBatch}
                pagination={false}
                rowKey="address"
              />
            ),
          },
        ]}
      />

      {!isCurrentBatchClaimed && (
        <Button type="primary" size="large" loading={isPending} onClick={handleClaimForBatch}>
          {isPreparing ? 'Preparing claim...' : 'Claim Incentives'}
        </Button>
      )}
    </Flex>
  </StakingIncentivesModalContainer>
);
