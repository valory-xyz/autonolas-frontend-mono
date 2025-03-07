import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  Modal,
  notification,
  Space,
  Statistic,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Allocation } from 'types';

import { COLOR } from 'libs/ui-theme/src';
import { CHAIN_NAMES, RETAINER_ADDRESS } from 'libs/util-constants/src';

import { NextWeekTooltip } from 'components/NextWeekTooltip';
import { useAppDispatch, useAppSelector } from 'store/index';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { voteForNomineeWeights } from 'common-util/functions';
import { INVALIDATE_AFTER_UPDATE_KEYS } from 'common-util/constants/scopeKeys';
import { RevokePower } from './RevokePower';
import { resetState } from 'common-util/functions/resetState';
import { useRemovedVotedNominees } from 'hooks/useRemovedNominees';
import { getBytes32FromAddress } from 'libs/util-functions/src';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const TEN_DAYS_IN_MS = 10 * ONE_DAY_IN_MS;

const { Countdown: CountdownAntd } = Statistic;
const { Text, Paragraph } = Typography;

type MyVote = {
  address?: string;
  name: string;
  chainId?: number;
  currentWeight: number;
  nextWeight: number;
  isRetainer?: boolean;
};

const VotesRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .highlight-row {
    background: #f2f4f9;
  }
`;

const Countdown = styled(CountdownAntd)`
  .ant-statistic-content {
    font-size: 18px;
  }
`;

const columns: ColumnsType<MyVote> = [
  {
    title: 'Staking contract',
    key: 'name',
    render: (_, record) =>
      record.address && record.chainId ? (
        <Space size={2} direction="vertical">
          <a href={`/contracts/${record.address}`} target="_blank">
            {record.name}
          </a>
          <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId}</Text>
        </Space>
      ) : (
        <Tooltip
          color={COLOR.WHITE}
          overlayStyle={{ maxWidth: '500px' }}
          title={
            <Paragraph className="m-0">
              Unused staking incentives are kept, unminted in the Rollover Pool. They can be made
              available in a future epoch by calling the <b>retain</b> method.
            </Paragraph>
          }
        >
          <Text type="secondary">
            {record.name} <InfoCircleOutlined className="ml-8" />
          </Text>
        </Tooltip>
      ),
    width: 300,
  },
  {
    title: 'My current weight',
    key: 'weight',
    dataIndex: 'currentWeight',
    render: (currentWeight) => <Text>{`${currentWeight}%`}</Text>,
  },
  {
    title: <NextWeekTooltip>My updated weight</NextWeekTooltip>,
    key: 'nextWeight',
    dataIndex: 'nextWeight',
    render: (nextWeight) => <Text>{`${nextWeight}%`}</Text>,
  },
];

const rowClassName = (record: MyVote): string => {
  return record.isRetainer ? 'highlight-row' : '';
};

type VotesProps = {
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  setAllocations: Dispatch<SetStateAction<Allocation[]>>;
};

export const Votes = ({ setIsUpdating, setAllocations }: VotesProps) => {
  const dispatch = useAppDispatch();
  const { stakingContracts } = useAppSelector((state) => state.govern);
  const { lastUserVote, userVotes } = useAppSelector((state) => state.govern);
  const { address: account } = useAccount();
  const [votesBlocked, setVotesBlocked] = useState(true);
  const { removedVotedNominees, isLoading: isRemovedNomineesLoading } =
    useRemovedVotedNominees(userVotes);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const showResetModal = () => setIsResetModalOpen(true);
  const closeResetModal = () => setIsResetModalOpen(false);

  useEffect(() => {
    if (isRemovedNomineesLoading || lastUserVote === null) {
      // block editing if data is loading
      setVotesBlocked(true);
    } else if (removedVotedNominees.length > 0) {
      // block editing if need to revoke power from removed nominees
      setVotesBlocked(true);
    } else {
      // block editing based on last vote timestamp and cooldown period
      setVotesBlocked(lastUserVote + TEN_DAYS_IN_MS > Date.now());
    }
  }, [lastUserVote, removedVotedNominees, isRemovedNomineesLoading]);

  const startEditing = () => {
    setIsUpdating(true);
    setAllocations(
      Object.entries(userVotes).reduce((acc: Allocation[], [key, value]) => {
        const contract = stakingContracts.find((contract) => contract.address === key);
        if (contract) {
          acc.push({
            address: contract.address,
            chainId: contract.chainId,
            metadata: contract.metadata,
            weight: value.next.power,
          });
        }
        return acc;
      }, []),
    );
  };

  const resetAllWeights = async () => {
    if (!account) return;

    setIsResetLoading(true);

    const nominees: Address[] = [];
    const chainIds: number[] = [];
    const weights: string[] = [];

    Object.keys(userVotes).forEach((address) => {
      const contract = stakingContracts.find((contract) => contract.address === address);
      if (contract) {
        // Set each staking contract's weight to 0
        nominees.push(contract.address);
        chainIds.push(contract.chainId);
        weights.push('0');
      } else if (address === getBytes32FromAddress(RETAINER_ADDRESS)) {
        // set the retainer's weight to 0
        nominees.push(getBytes32FromAddress(RETAINER_ADDRESS));
        chainIds.push(1);
        weights.push('0');
      }
    });

    // Vote
    voteForNomineeWeights({ account, nominees, chainIds, weights })
      .then(() => {
        closeResetModal();
        notification.success({
          message: 'Your votes have been reset',
        });

        resetState(INVALIDATE_AFTER_UPDATE_KEYS, dispatch);
      })
      .catch((error) => {
        notification.error({
          message: error.message,
        });
      })
      .finally(() => {
        setIsResetLoading(false);
      });
  };

  const unblockVoting = () => setVotesBlocked(false);
  const deadline = lastUserVote ? lastUserVote + TEN_DAYS_IN_MS : undefined;

  const data: MyVote[] = useMemo(() => {
    const userVotesArray = Object.entries(userVotes);

    if (userVotesArray.length === 0 || stakingContracts.length === 0) {
      return [];
    }

    return userVotesArray.reduce((res: MyVote[], [key, value]) => {
      const contract = stakingContracts.find((item) => item.address === key);
      if (contract) {
        res.push({
          address: contract.address,
          name: contract.metadata?.name,
          chainId: contract.chainId,
          currentWeight: value.current.power,
          nextWeight: value.next.power,
        });
      }

      if (key === getBytes32FromAddress(RETAINER_ADDRESS)) {
        res.push({
          name: 'Rollover pool',
          currentWeight: value.current.power,
          nextWeight: value.next.power,
          isRetainer: true,
        });
      }
      return res.sort((item) =>
        // put Rollover pool at the end
        item.isRetainer ? 1 : -1,
      );
    }, []);
  }, [userVotes, stakingContracts]);

  return (
    <>
      <VotesRoot>
        {removedVotedNominees.length > 0 && <RevokePower contracts={removedVotedNominees} />}
        <Flex gap={16} align="center" wrap="wrap">
          {votesBlocked && lastUserVote !== null && (
            <Text type="secondary">
              <Countdown
                prefix={<Text type="secondary">Cooldown period: </Text>}
                format={
                  deadline && deadline < Date.now() + ONE_DAY_IN_MS
                    ? 'H[h] m[m] s[s]'
                    : 'D[d] H[h] m[m]'
                }
                value={deadline}
                onFinish={unblockVoting}
              />
            </Text>
          )}
          <Flex gap={8} wrap="wrap" className="ml-auto">
            <Button size="large" disabled={votesBlocked} onClick={showResetModal}>
              Reset all weights
            </Button>
            <Button size="large" type="primary" disabled={votesBlocked} onClick={startEditing}>
              Update voting weight
            </Button>
          </Flex>
        </Flex>
        <Table<MyVote>
          columns={columns}
          dataSource={data}
          pagination={false}
          rowClassName={rowClassName}
          rowKey={(record) => record.address || record.name}
        />
      </VotesRoot>
      <Modal
        title="Reset all weights"
        open={isResetModalOpen}
        onOk={resetAllWeights}
        onCancel={closeResetModal}
        cancelText="Cancel"
        okText="Reset all weights"
        confirmLoading={isResetLoading}
      >
        <Paragraph>
          This will seize all your voting weight, including unallocated ones applied to the Rollover
          Pool.
        </Paragraph>
        <Paragraph>
          After you confirm, you’ll enter a 10 day cooldown period. You won&apos;t be able to update
          your weights during that time.
        </Paragraph>
      </Modal>
    </>
  );
};
