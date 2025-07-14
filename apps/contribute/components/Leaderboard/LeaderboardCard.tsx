import { Card, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Link from 'next/link';

import { EducationTitle } from 'common-util/Education/EducationTitle';
import { getName } from 'common-util/functions';
import { useAppSelector } from 'store/setup';
import { LeaderboardUser } from 'store/types';

export const LeaderboardCard = () => {
  const isLoading = useAppSelector((state) => state.setup.isLeaderboardLoading);
  const leaderboard = useAppSelector((state) => state.setup.leaderboard);
  const limitedLeaderboardList = leaderboard.slice(0, 5);

  const columns: ColumnsType<LeaderboardUser> = [
    { title: 'Rank', dataIndex: 'rank', width: 50 },
    {
      title: 'Name',
      width: 250,
      render: (record) => <Link href={`/profile/${record.wallet_address}`}>{getName(record)}</Link>,
    },
  ];

  return (
    <Card
      title={<EducationTitle title="Leaderboard – Top 5" educationItem="leaderboard" level={5} />}
      bodyStyle={{ padding: 0 }}
      extra={<Link href="/leaderboard">See all &rarr;</Link>}
      actions={[
        <Link href="/leaderboard" key="leaderboard">
          Start earning points
        </Link>,
      ]}
    >
      <Table
        columns={columns}
        size="small"
        dataSource={limitedLeaderboardList}
        loading={isLoading}
        bordered={false}
        pagination={false}
        rowKey="id"
      />
    </Card>
  );
};
