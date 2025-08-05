import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';
import { AvailableOn, StakingContract } from 'types';

import { Caption, TextWithTooltip } from 'libs/ui-components/src';
import { BREAK_POINT } from 'libs/ui-theme/src';
import { CHAIN_NAMES, GOVERN_URL, NA, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { formatWeiNumber } from 'libs/util-functions/src';

import { RunAgentButton } from 'components/RunAgentButton';

import { useStakingContractsList } from './hooks';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: ${BREAK_POINT.xl};
  margin: 0 auto;
`;

const { Title, Paragraph, Text } = Typography;

const columns: ColumnsType<StakingContract> = [
  {
    title: 'Contract Info',
    key: 'contractInfo',
    render: (_, record) => (
      <>
        <Text strong>{record.metadata?.name || NA}</Text>
        <br />
        <Text type="secondary">{CHAIN_NAMES[record.chainId] || record.chainId} chain</Text>
      </>
    ),
  },
  {
    title: (
      <TextWithTooltip
        text="Current Epoch"
        description="The number of the current epoch and time till the next epoch"
      />
    ),
    key: 'currentEpoch',
    render: (_, record) => {
      console.log(record.timeRemaining);
      return (
        <>
          <Text>{record.epoch}</Text>
          <br />
          <Text type="secondary">{record.timeRemaining}</Text>
        </>
      );
    },
    width: 130,
    className: 'text-center',
  },
  {
    title: 'Available slots',
    dataIndex: 'availableSlots',
    key: 'availableSlots',
    render: (availableSlots, record) => <Text>{`${availableSlots} / ${record.maxSlots}`}</Text>,
    className: 'text-end',
    width: 60,
  },
  {
    title: () => <TextWithTooltip text="APY" description="Annual percentage yield" />,
    dataIndex: 'apy',
    key: 'apy',
    render: (apy) => <Tag color="purple" className="m-0">{`${apy}%`}</Tag>,
    className: 'text-end',
  },
  {
    title: () => 'Available Rewards, OLAS',
    dataIndex: 'availableRewards',
    key: 'availableRewards',
    render: (availableRewards) => <Text>{formatWeiNumber({ value: availableRewards })}</Text>,
    className: 'text-end',
    width: 120,
  },
  {
    title: 'Stake required, OLAS',
    dataIndex: 'stakeRequired',
    key: 'stakeRequired',
    render: (stakeRequired) => <Text>{stakeRequired}</Text>,
    className: 'text-end',
    width: 120,
  },
  {
    title: 'Minimum operating balance required',
    dataIndex: 'minOperatingBalance',
    key: 'minOperatingBalance',
    render: (_, contract) => {
      const { minOperatingBalanceHint, minOperatingBalance, minOperatingBalanceToken } = contract;
      if (typeof minOperatingBalance !== 'number') return <Text>{NA}</Text>;

      const value = `${minOperatingBalance} ${minOperatingBalanceToken}`;
      if (!minOperatingBalanceHint) return <Text>{value}</Text>;

      return (
        <Flex vertical>
          <Text>{`~${value}`}</Text>
          <Text>{minOperatingBalanceHint}</Text>
        </Flex>
      );
    },
    className: 'text-end',
    width: 180,
  },
  {
    title: () => (
      <TextWithTooltip
        text="Available on"
        description={
          <>
            <Text strong>Pearl</Text> - desktop app for non-technical users to run agents.
            <br />
            <Text strong>Quickstart</Text> - script for technical users to run agents with more
            flexibility.
            <br />
            <Text strong>Contribute</Text> - web app that enables you to get rewards for posting
            about Olas on X.
          </>
        }
      />
    ),
    dataIndex: 'availableOn',
    key: 'availableOn',
    render: (availableOn) =>
      availableOn && availableOn.length !== 0 ? (
        <Flex gap={4} vertical align="start">
          {availableOn.map((type: AvailableOn) => (
            <RunAgentButton availableOn={type} key={type} />
          ))}
        </Flex>
      ) : (
        <Button type="text" disabled>
          Not available yet
        </Button>
      ),
  },
];

export const ContractsPage = () => {
  const { contracts, isLoading } = useStakingContractsList();
  return (
    <StyledMain>
      <Card>
        <Title level={3} className="mt-0 mb-8">
          Staking contracts
        </Title>
        <Caption className="block mb-24">
          Browse staking opportunities. Make a selection and start running them via Pearl or
          Quickstart for the opportunity to earn OLAS rewards.
        </Caption>

        <Table
          columns={columns}
          pagination={false}
          loading={isLoading}
          dataSource={contracts}
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
            expandedRowRender: (record) => (
              <>
                <Caption>Contract description</Caption>
                <Paragraph className="mb-12" style={{ maxWidth: 500 }}>
                  {record.metadata ? record.metadata.description : NA}
                </Paragraph>
                <a href={`${GOVERN_URL}/contracts/${record.address}`} target="_blank">
                  View full contract details {UNICODE_SYMBOLS.EXTERNAL_LINK}
                </a>
              </>
            ),
          }}
          scroll={{ x: 1000 }}
          rowHoverable={false}
        />
      </Card>
    </StyledMain>
  );
};
