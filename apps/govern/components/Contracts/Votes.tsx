import { Button, Flex, Space, Statistic, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useMemo } from 'react';

import { useAppSelector } from 'store/index';
import styled from 'styled-components';

import { CHAIN_NAMES } from 'common-util/functions';

const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;

const { Countdown: CountdownAntd } = Statistic;
const { Text } = Typography;

const Countdown = styled(CountdownAntd)`
  .ant-statistic-content {
    font-size: 18px;
  }
`;

type MyVote = {
  address: string;
  name: string;
  chainId: number;
  currentWeight: number;
  nextWeight: number;
};

const columns: ColumnsType<MyVote> = [
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

export const Votes = () => {
  const { stakingContracts } = useAppSelector((state) => state.govern);
  const { lastUserVote, userVotes } = useAppSelector((state) => state.govern);

  const votesBlocked = useMemo(
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
            address: contract?.address,
            name: contract?.metadata?.name,
            chainId: contract?.chainId,
            currentWeight: value.current.power,
            nextWeight: value.next.power,
          });
        }
        return res;
      }, []);
    } else {
      return [];
    }
  }, [userVotes, stakingContracts]);

  return (
    <>
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
          <Button type="primary" disabled={lastUserVote !== null}>
            Update voting weight
          </Button>
        </Flex>
      )}
      <Table className="mt-16" columns={columns} dataSource={data} pagination={false} />
    </>
  );
};
