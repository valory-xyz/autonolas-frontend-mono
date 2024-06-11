import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Statistic, Table, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useMemo } from 'react';

import { COLOR } from '@autonolas/frontend-library';

import { useAppSelector } from 'store/index';
import styled from 'styled-components';

import { RETAINER_ADDRESS } from 'common-util/constants/addresses';
import { CHAIN_NAMES, getBytes32FromAddress } from 'common-util/functions';

const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;

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
          <Link href={`/contracts/${record.address}`}>{record.name}</Link>
          <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId}</Text>
        </Space>
      ) : (
        <Tooltip
          color={COLOR.WHITE}
          title={
            <Paragraph className="m-0">
              Unused staking incentives are retained unminted in the Rollover Pool
            </Paragraph>
          }
        >
          <Text type="secondary">
            {record.name} <InfoCircleOutlined className="ml-8" />
          </Text>
        </Tooltip>
      ),
    width: 200,
  },
  {
    title: 'Current weight',
    key: 'weight',
    render: (_, record) => <Text>{`${record.currentWeight}%`}</Text>,
    width: 120,
  },
  {
    title: 'Next weight',
    key: 'nextWeight',
    render: (_, record) => <Text>{`${record.nextWeight}%`}</Text>,
    width: 140,
  },
];

const rowClassName = (record: MyVote): string => {
  return record.isRetainer ? 'highlight-row' : '';
};

export const Votes = () => {
  const { stakingContracts } = useAppSelector((state) => state.govern);
  const { lastUserVote, userVotes } = useAppSelector((state) => state.govern);

  const votesBlocked = useMemo(
    // TODO: unblock somehow, once counter is finished
    () => (lastUserVote !== null ? lastUserVote + TEN_DAYS_IN_MS > Date.now() : false),
    [lastUserVote],
  );

  const data: MyVote[] = useMemo(() => {
    const userVotesArray = Object.entries(userVotes);
    if (userVotesArray.length > 0 && stakingContracts.length > 0) {
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
        return res;
      }, []);
    } else {
      return [];
    }
  }, [userVotes, stakingContracts]);

  return (
    <VotesRoot>
      {votesBlocked && (
        <Flex gap={16} align="center" justify="end">
          <Text type="secondary">
            {lastUserVote !== null && (
              <Countdown
                prefix={<Text type="secondary">Cooldown period: </Text>}
                format="D[d] H[h] m[m]"
                value={lastUserVote + TEN_DAYS_IN_MS}
              />
            )}
          </Text>
          <Button type="primary" disabled={votesBlocked}>
            Update voting weight
          </Button>
        </Flex>
      )}
      <Table<MyVote>
        className="mt-16"
        columns={columns}
        dataSource={data}
        pagination={false}
        rowClassName={rowClassName}
      />
    </VotesRoot>
  );
};