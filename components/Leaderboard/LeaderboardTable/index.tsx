import { Card, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import styled from 'styled-components';

import { COLOR, NA } from '@autonolas/frontend-library';

import { getName, getTier } from 'common-util/functions';
import { useAppSelector } from 'store/setup';
import { LeaderboardUser } from 'store/types';

const { Text, Title, Paragraph } = Typography;

const Name = styled.a`
  max-width: 280px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const columns: ColumnsType<LeaderboardUser> = [
  { title: 'Rank', dataIndex: 'rank', width: 50 },
  {
    title: 'Name',
    width: 250,
    render: (record) => (
      <Link href={`/profile/${record.wallet_address}`} passHref legacyBehavior>
        <Name>{getName(record)}</Name>
      </Link>
    ),
  },
  {
    title: 'Socials',
    width: 100,
    render: (record) => {
      const { wallet_address, twitter_handle, discord_id, id } = record;

      const socials = [
        wallet_address && (
          <a
            href={`https://etherscan.io/address/${wallet_address}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Wallet address"
            key={`${id}-wallet`}
            className="mr-12"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512">
              <path
                fill={COLOR.GREY_2}
                d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"
              />
            </svg>
          </a>
        ),
        twitter_handle && (
          <a
            href={`https://x.com/${twitter_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X handle"
            key={`${id}-X`}
            className="mr-12"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 300 271">
              <path
                fill={COLOR.GREY_2}
                d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"
              />
            </svg>
          </a>
        ),
        // discord_id && (
        //   <a
        //     href={`https://discord.com/users/${discord_id}`}
        //     target="_blank"
        //     rel="noopener noreferrer"
        //     aria-label="Discord ID"
        //     key={`${id}-discord`}
        //   >
        //     <svg
        //       xmlns="http://www.w3.org/2000/svg"
        //       height="1em"
        //       viewBox="0 0 640 512"
        //     >
        //       <path
        //         fill={COLOR.GREY_2}
        //         d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"
        //       />
        //     </svg>
        //   </a>
        // ),
      ].filter(Boolean);

      if (socials.length === 0) return NA;

      return socials.map((social, index) => (
        <Text type="secondary" key={`${id}-social-${index}`}>
          {social}
        </Text>
      ));
    },
  },
  {
    title: 'Points',
    dataIndex: 'points',
    width: 120,
  },
  {
    title: 'Tier',
    dataIndex: 'points',
    render: (points) => getTier(points),
    responsive: ['md'],
    width: 140,
  },
];

export const LeaderboardTable = () => {
  const isLoading = useAppSelector((state) => state.setup.isLeaderboardLoading);
  const leaderboard = useAppSelector((state) => state.setup.leaderboard);

  return (
    <Card className="section">
      <Title level={3} className="mt-0 mb-8">
        Leaderboard
      </Title>
      <Paragraph type="secondary">
        Climb the leaderboard by completing actions that contribute to Olas’ success.
      </Paragraph>
      <Table
        columns={columns}
        dataSource={leaderboard}
        loading={isLoading}
        pagination={false}
        rowKey="id"
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};
