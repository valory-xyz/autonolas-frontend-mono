import { ReadOutlined } from '@ant-design/icons';
import { Card, Table, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { useAppSelector } from 'store/setup';

const { Title, Paragraph } = Typography;

const Description = styled.div`
  color: #4d596a;
  a {
    color: #4d596a;
    text-decoration: underline;
  }
`;

const DESCRIPTION_BY_IDS: Record<string, React.ReactNode> = {
  ['Agents Unleashed Singapore']: (
    <Description>
      🔥 Hype up the premier Crypto x AI side event at TOKEN2049 Singapore this year,{' '}
      <b>Agents Unleashed Singapore: The Next Wave.</b> Share venue pics, agenda, your excitement
      and why it&apos;s a <i>must-attend</i> event. Tag your friends, build excitement, share
      previous{' '}
      <a
        href="https://www.youtube.com/@autonolas/playlists"
        target="_blank"
        rel="noopener noreferrer"
      >
        YouTube videos
      </a>
      {', '}
      <a href="https://x.com/autonolas" target="_blank" rel="noopener noreferrer">
        photos
      </a>{' '}
      from previous events, and drive{' '}
      <b>
        registrations at this{' '}
        <a href="https://luma.com/h0zgn96s" target="_blank" rel="noopener noreferrer">
          link
        </a>
        .
      </b>
    </Description>
  ),
  ['Co-own AI']: (
    <Description>
      AI shouldn&apos;t be rented by the few, it should be owned by all. Spread this message and
      share how Olas is building the future of <b>co-owned AI</b> as one of the OG AI Agent project
      in the space. Tell people{' '}
      <a href="https://olas.network/about" target="_blank" rel="noopener noreferrer">
        what co-owned AI is
      </a>
      , how Olas is working towards that mission, and how they can{' '}
      <a href="https://olas.network/" target="_blank" rel="noopener noreferrer">
        get started
      </a>
      . 🟪
    </Description>
  ),
  ['Olas AI Agents']: (
    <Description>
      Spread the word about Olas&apos; dominance in enabling{' '}
      <a
        href="https://x.com/autonolas/status/1864671146702155938"
        target="_blank"
        rel="noopener noreferrer"
      >
        Agent-to-Agent transactions ↗
      </a>
      , the different operational{' '}
      <a
        href="https://x.com/autonolas/status/1867147410583253006"
        target="_blank"
        rel="noopener noreferrer"
      >
        Olas Agents ↗
      </a>
      , and more. Share the link to running agents via Pearl.
    </Description>
  ),
};

const columns = [
  {
    title: 'Keyword',
    dataIndex: 'hashtag',
    render: (hashtag: string) => hashtag,
    width: 120,
  },
  Table.EXPAND_COLUMN,
];

export const Campaigns = () => {
  const { moduleDetails, isModuleDetailsLoading: isLoading } = useAppSelector(
    (state) => state.setup,
  );
  const activeTwitterCampaigns = (moduleDetails?.twitter_campaigns?.campaigns || []).filter(
    (campaign) => campaign.status === 'live',
  );

  return (
    <Card>
      <Title level={3} className="mt-0 mb-8">
        Campaigns
      </Title>
      <Paragraph>
        Mention{' '}
        <a href="https://x.com/autonolas" target="_blank" rel="noopener noreferrer">
          @autonolas
        </a>{' '}
        or use at least one of the following keywords in your post to earn leaderboard points and be
        eligible for staking rewards.
      </Paragraph>
      <Paragraph>
        The leaderboard points you can earn by posting vary according to the AI&apos;s evaluation.
      </Paragraph>
      <Table
        columns={columns}
        dataSource={activeTwitterCampaigns}
        expandable={{
          expandIcon: ({ onExpand, record }) => {
            const Icon = ReadOutlined;
            return (
              <div
                style={{ fontSize: '14px', color: '#7E22CE', cursor: 'pointer' }}
                onClick={(event) => onExpand(record, event)}
              >
                <Icon /> Guide
              </div>
            );
          },
          expandedRowRender: (record) => {
            const desc = DESCRIPTION_BY_IDS[record.id];
            return desc;
          },
        }}
        loading={isLoading}
        rowKey={'id'}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};
