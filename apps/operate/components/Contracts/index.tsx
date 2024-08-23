import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Image from 'next/image';
import styled from 'styled-components';
import { StakingContract } from 'types';

import { Caption, TextWithTooltip } from 'libs/ui-components/src';
import { BREAK_POINT } from 'libs/ui-theme/src';
import { CHAIN_NAMES, GOVERN_URL, NA, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { useStakingContractsList } from './hooks';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: ${BREAK_POINT.xl};
  margin: 0 auto;
`;

const { Title, Paragraph, Text } = Typography;

const getAvailableOnData = (availableOn: StakingContract['availableOn']) => {
  let icon;
  let text;
  let href;

  switch (availableOn) {
    case 'pearl':
      icon = <Image src={`/images/pearl.svg`} alt="Pearl app" width={18} height={18} />;
      text = 'Pearl';
      href = 'https://olas.network/operate#download';
      break;
    case 'quickstart':
      icon = <Image src={`/images/github.svg`} alt="Github" width={18} height={18} />;
      text = 'Quickstart';
      href = 'https://github.com/valory-xyz/trader-quickstart';
      break;
    default:
      text = 'Not available yet';
      break;
  }

  return { icon, text, href };
};

const columns: ColumnsType<StakingContract> = [
  {
    title: 'Contract',
    dataIndex: 'metadata',
    key: 'address',
    render: (metadata) => <Text strong>{metadata.name || NA}</Text>,
  },
  {
    title: 'Chain',
    dataIndex: 'chainId',
    key: 'chainId',
    render: (chainId) => <Text type="secondary">{CHAIN_NAMES[chainId] || chainId}</Text>,
  },
  {
    title: 'Available slots',
    dataIndex: 'availableSlots',
    key: 'availableSlots',
    render: (availableSlots, record) => <Text>{`${availableSlots} / ${record.maxSlots}`}</Text>,
  },
  {
    title: () => <TextWithTooltip text="APY" description="Annual percentage yield" />,
    dataIndex: 'apy',
    key: 'apy',
    render: (apy) => <Tag color="purple">{`${apy}%`}</Tag>,
  },
  {
    title: 'Stake required, OLAS',
    dataIndex: 'stakeRequired',
    key: 'stakeRequired',
    render: (stakeRequired) => <Text>{stakeRequired}</Text>,
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
          </>
        }
      />
    ),
    dataIndex: 'availableOn',
    key: 'availableOn',
    render: (availableOn) => {
      const { icon, text, href } = getAvailableOnData(availableOn);

      if (href) {
        return (
          <Button type="text" href={href} target="_blank">
            <Flex gap={8} align="center">
              {icon} {text} {UNICODE_SYMBOLS.EXTERNAL_LINK}
            </Flex>
          </Button>
        );
      }

      return (
        <Button type="text" disabled>
          {text}
        </Button>
      );
    },
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
        />
      </Card>
    </StyledMain>
  );
};
