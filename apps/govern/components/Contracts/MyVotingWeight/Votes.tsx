import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Statistic, Table, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Allocation } from 'types';

import { COLOR } from 'libs/ui-theme/src';
import { CHAIN_NAMES, RETAINER_ADDRESS } from 'libs/util-constants/src';

import { getBytes32FromAddress } from 'common-util/functions/addresses';
import { NextWeekTooltip } from 'components/NextWeekTooltip';
import { useAppSelector } from 'store/index';

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
  const { stakingContracts } = useAppSelector((state) => state.govern);
  const { lastUserVote, userVotes } = useAppSelector((state) => state.govern);
  const [votesBlocked, setVotesBlocked] = useState(false);

  useEffect(() => {
    setVotesBlocked(lastUserVote !== null ? lastUserVote + TEN_DAYS_IN_MS > Date.now() : false);
  }, [lastUserVote]);

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
    <VotesRoot>
      <Flex gap={16} align="center" justify="end">
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
        <Button size="large" type="primary" disabled={votesBlocked} onClick={startEditing}>
          Update voting weight
        </Button>
      </Flex>
      <Table<MyVote>
        className="mt-16"
        columns={columns}
        dataSource={data}
        pagination={false}
        rowClassName={rowClassName}
        rowKey={(record) => record.address || record.name}
      />
    </VotesRoot>
  );
};
