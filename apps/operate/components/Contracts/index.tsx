import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Table, TableColumnsType, Tag, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import { Caption, TextWithTooltip } from 'libs/ui-components/src';
import { BREAK_POINT } from 'libs/ui-theme/src';
import { CHAIN_NAMES, GOVERN_URL, UNICODE_SYMBOLS } from 'libs/util-constants/src';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: ${BREAK_POINT.xl};
  margin: 0 auto;
`;

const { Title, Paragraph, Text } = Typography;

interface DataType {
  key: React.Key;
  name: string;
  address: string;
  chainId: number;
  availableSlots: number;
  maxSlots: number;
  apy: number;
  stakeRequired: number;
  availableOn: string;
  description: string;
}

const getAvailableOnData = (availableOn: string) => {
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

const columns: TableColumnsType<DataType> = [
  {
    title: 'Contract',
    dataIndex: 'name',
    key: 'name',
    render: (name) => <Text strong>{name}</Text>,
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

const data: DataType[] = [
  {
    key: 1,
    name: 'Pearl Beta',
    address: '',
    chainId: 100,
    availableSlots: 80,
    maxSlots: 100,
    apy: 10,
    stakeRequired: 40,
    availableOn: 'pearl',
    description:
      'The Pearl Beta staking contract offers 100 slots for operators running Olas Predict agents with Pearl. It is designed as a step up from Pearl Alpha, requiring 40 rather than 20 OLAS for staking. The rewards are also more attractive than with Pearl Alpha.',
  },
  {
    key: 2,
    name: 'Quickstart Beta - Hobbyist',
    address: '',
    chainId: 100,
    availableSlots: 92,
    maxSlots: 100,
    apy: 15,
    stakeRequired: 500,
    availableOn: 'quickstart',
    description:
      'The Pearl Beta staking contract offers 100 slots for operators running Olas Predict agents with Pearl. It is designed as a step up from Pearl Alpha, requiring 40 rather than 20 OLAS for staking. The rewards are also more attractive than with Pearl Alpha.',
  },
  {
    key: 3,
    name: 'Quickstart Beta - Expert',
    address: '',
    chainId: 100,
    availableSlots: 10,
    maxSlots: 100,
    apy: 15,
    stakeRequired: 1000,
    availableOn: '',
    description:
      'The Pearl Beta staking contract offers 100 slots for operators running Olas Predict agents with Pearl. It is designed as a step up from Pearl Alpha, requiring 40 rather than 20 OLAS for staking. The rewards are also more attractive than with Pearl Alpha.',
  },
];

export const ContractsPage = () => (
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
                {record.description}
              </Paragraph>
              <a href={`${GOVERN_URL}/contracts/${record.address}`} target="_blank">
                View full contract details {UNICODE_SYMBOLS.EXTERNAL_LINK}
              </a>
            </>
          ),
        }}
        dataSource={data}
      />
    </Card>
  </StyledMain>
);
