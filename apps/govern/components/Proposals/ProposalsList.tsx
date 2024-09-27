import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { getFormattedDate, voteForProposal } from 'common-util/functions';
import { Proposal } from 'common-util/graphql/types';
import { useProposals } from 'hooks/useProposals';
import { useVotingPower } from 'hooks/useVotingPower';
import { setProposalVotes } from 'store/govern';
import { useAppDispatch } from 'store/index';

import { ProposalDetails } from './ProposalDetails';
import {
  VOTES_SORTED,
  VOTES_SUPPORT,
  getFormattedValue,
  getUserVote,
  hasNotStarted,
  isOngoing,
} from './utils';

const { Text } = Typography;

const Status = ({ item, block }: { item: Proposal; block: bigint | undefined }) => {
  if (item.isExecuted) return <Tag color="green"> Executed</Tag>;
  if (item.isCancelled) return <Tag color="volcano"> Cancelled</Tag>;
  if (item.isQueued) return <Tag color="gold"> Queued</Tag>;

  // check if the current block is between proposal's start and end blocks
  if (isOngoing(item, block)) {
    return <Tag color="blue">Ongoing</Tag>;
  }

  return <Tag>Created</Tag>;
};

const getColumns = (
  block: bigint | undefined,
  address: Address | undefined,
  isVoting: boolean,
  handleVote: (proposalId: string, support: number) => void,
): ColumnsType<Proposal> => [
  {
    title: 'Name',
    dataIndex: 'description',
    key: 'name',
    render: (description) => (
      <Text strong ellipsis style={{ width: 200 }}>
        {description}
      </Text>
    ),
  },
  {
    title: 'Created',
    dataIndex: 'blockTimestamp',
    key: 'created',
    width: 120,
    render: (blockTimestamp) => <Text>{getFormattedDate(Number(blockTimestamp * 1000))}</Text>,
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: (_, record) => {
      return <Status item={record} block={block} />;
    },
  },
  {
    title: 'Votes for',
    dataIndex: 'votesFor',
    key: 'votesFor',
    width: 105,
    render: (votesFor) => <Text>{getFormattedValue(votesFor)}</Text>,
  },
  {
    title: 'Votes against',
    dataIndex: 'votesAgainst',
    key: 'votesAgainst',
    width: 140,
    render: (votesAgainst) => <Text>{getFormattedValue(votesAgainst)}</Text>,
  },
  {
    title: 'Quorum',
    key: 'quorum',
    width: 120,
    render: (_, record) => (
      <Text>
        {getFormattedValue(record.votesFor)} / {hasNotStarted(record, block) && '~'}
        {getFormattedValue(record.quorum)}
      </Text>
    ),
  },
  {
    title: 'Vote',
    key: 'action',
    render: (_, record) => {
      if (isOngoing(record, block)) {
        const userVote = address ? getUserVote(record, address) : null;
        if (userVote) {
          return (
            <Button type="primary" ghost disabled>
              You voted {VOTES_SUPPORT[userVote.support]}
            </Button>
          );
        }
        return (
          <Button.Group>
            {VOTES_SORTED.map((key) => (
              <Button
                key={key}
                type="primary"
                ghost
                disabled={isVoting}
                onClick={() => handleVote(record.proposalId, Number(key))}
              >
                {VOTES_SUPPORT[key]}
              </Button>
            ))}
          </Button.Group>
        );
      }

      if (hasNotStarted(record, block)) {
        return (
          <Button type="primary" ghost disabled>
            Voting not started
          </Button>
        );
      }

      return (
        <Button type="primary" ghost disabled>
          Voting closed
        </Button>
      );
    },
  },
];

export const ProposalsList = () => {
  const { data, block, isLoading } = useProposals();
  const { address } = useAccount();
  const { dataInWei: votingPower } = useVotingPower(address);
  const dispatch = useAppDispatch();

  const [isVoting, setIsVoting] = useState(false);

  const handleVote = (proposalId: string, support: number) => {
    if (!address) {
      notifyError('Please connect your wallet');
      return;
    }

    if (!votingPower || Number(votingPower) === 0) {
      notifyError("You don't have enough voting power");
      return;
    }

    setIsVoting(true);

    voteForProposal({ account: address, proposalId, support })
      .then(() => {
        notifySuccess('Vote successfully');
        dispatch(
          setProposalVotes({
            [proposalId]: {
              id: proposalId,
              weight: votingPower,
              support,
              voter: address,
            },
          }),
        );
      })
      .catch((error) => {
        notifyError(error.message);
      })
      .finally(() => {
        setIsVoting(false);
      });
  };

  return (
    <Table
      columns={getColumns(block?.number, address, isVoting, handleVote)}
      loading={isLoading}
      dataSource={data}
      rowKey="id"
      expandable={{
        expandIcon: ({ expanded, onExpand, record }) => {
          const Icon = expanded ? DownOutlined : RightOutlined;
          return (
            <Icon
              style={{ fontSize: '14px', color: '#606F85' }}
              onClick={(e) => onExpand(record, e)}
            />
          );
        },
        expandedRowRender: (record) => <ProposalDetails item={record} currentBlock={block} />,
      }}
      scroll={{ x: 1000 }}
      rowHoverable={false}
      pagination={false}
    />
  );
};
