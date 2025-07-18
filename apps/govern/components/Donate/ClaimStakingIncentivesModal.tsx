import { useEffect, useMemo, useState } from 'react';
import { Button, Collapse, Flex, Modal, Space, Steps, Table, Tag, Typography } from 'antd';

import { formatWeiNumber, notifyError, notifySuccess } from 'libs/util-functions/src';
import { useAppSelector } from 'store/index';
import { StakingContract } from 'types';
import { useClaimableNomineesBatches } from 'hooks/useClaimableSet';
import { useClaimStakingIncentivesBatch } from 'hooks/useClaimStakingIncentivesBatch';

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

type ClaimStakingIncentivesModalProps = {
  onClose: () => void;
};

export const ClaimStakingIncentivesModal = ({ onClose }: ClaimStakingIncentivesModalProps) => {
  const [currentBatch, setCurrentBatch] = useState(0);
  const [claimedBatches, setClaimedBatches] = useState<number[]>([]);
  const { stakingContracts } = useAppSelector((state) => state.govern);

  const { nomineesToClaimBatches, refetchClaimableBatches } = useClaimableNomineesBatches();
  const { claimIncentivesForBatch, isPending } = useClaimStakingIncentivesBatch({
    onSuccess: () => {
      setClaimedBatches((prev) => [...prev, currentBatch]);
      // Only move to next batch, if more batches are remaining.
      if (currentBatch < nomineesToClaimBatches.length - 1) {
        setTimeout(() => {
          setCurrentBatch((prev) => prev + 1);
        }, STEP_CHANGE_DELAY);
      }
      notifySuccess(`Staking incentives for batch ${currentBatch + 1} claimed successfully`);
    },
    onError: (error) => {
      console.error(error);
      notifyError(`Failed to claim staking incentives for batch ${currentBatch + 1}`);
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
      .filter((nominee) => nominee !== null);
  }, [currentBatch, nomineesToClaimBatches, stakingContracts]);

  // Refresh claimable batches every time the modal is opened.
  useEffect(() => {
    refetchClaimableBatches();
  }, [refetchClaimableBatches]);

  const handleClaimForBatch = () => claimIncentivesForBatch(nomineesToClaimBatches[currentBatch]);

  if (nomineesToClaimBatches.length === 0) {
    return (
      <Modal {...modalProps} onCancel={onClose}>
        <StakingIncentivesModalContainer $isEmpty={true}>
          <Text>All staking incentives were claimed this epoch.</Text>
        </StakingIncentivesModalContainer>
      </Modal>
    );
  }

  const isCurrentBatchClaimed = claimedBatches.includes(currentBatch);
  return (
    <Modal {...modalProps} onCancel={onClose}>
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
              Claim Incentives
            </Button>
          )}
        </Flex>
      </StakingIncentivesModalContainer>
    </Modal>
  );
};
