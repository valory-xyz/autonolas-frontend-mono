import { DownOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Input, Select, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AvailableOn, StakingContract } from 'types';

import { Caption, TextWithTooltip } from 'libs/ui-components/src';
import { COLOR } from 'libs/ui-theme/src';
import {
  CHAIN_NAMES,
  GOVERN_URL,
  NA,
  OPERATE_REPO_URL,
  UNICODE_SYMBOLS,
} from 'libs/util-constants/src';
import { formatWeiNumber } from 'libs/util-functions/src';

import { RunAgentButton } from 'components/RunAgentButton';

import {
  CHAIN_LOGOS,
  CHAIN_OPTIONS,
  FILTER_DROPDOWN_CLASS,
  PLATFORM_OPTIONS,
  PLATFORM_SELECT_CLASS,
  TAB_LIVE,
  TAB_NOT_AVAILABLE,
  TAB_OPTIONS,
} from './constants';
import { useStakingContractsList } from './hooks';
import {
  FilterDropdownStyles,
  FilterRow,
  LiveNotAvailableSwitch,
  PlatformSelectLabel,
  PlatformSelectWrap,
  StyledCard,
  StyledMain,
  TableWrapper,
} from './styles';

const { Title, Paragraph, Text } = Typography;

const isLiveContract = (c: StakingContract) => c.availableOn != null && c.availableOn.length > 0;

const getTableColumns = (): ColumnsType<StakingContract> => [
  {
    title: 'Contract',
    key: 'contractInfo',
    render: (_, record) => {
      const chainLabel = `${CHAIN_NAMES[record.chainId] || record.chainId} chain`;
      const logoSrc = CHAIN_LOGOS[record.chainId];
      return (
        <>
          <Text strong>{record.metadata?.name || NA}</Text>
          <br />
          <Flex align="center" gap={8}>
            <Text type="secondary">{chainLabel}</Text>
            {logoSrc && (
              <Image
                src={logoSrc}
                alt={`${chainLabel} logo`}
                width={20}
                height={20}
                style={{ flexShrink: 0 }}
              />
            )}
          </Flex>
        </>
      );
    },
  },
  {
    title: (
      <TextWithTooltip
        text="Current epoch"
        description="The number of the current epoch and time till the next epoch"
      />
    ),
    key: 'currentEpoch',
    render: (_, record) => (
      <>
        <Text>{record.epoch}</Text>
        <br />
        <Text type="secondary">{record.timeRemaining}</Text>
      </>
    ),
    width: 160,
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
    render: (apy) => (
      <Tag color="purple" className="m-0">
        {apy ? `${apy}%` : NA}
      </Tag>
    ),
    className: 'text-end',
  },
  {
    title: () => 'Rewards Pool, OLAS',
    dataIndex: 'availableRewards',
    key: 'availableRewards',
    render: (availableRewards) => (
      <Flex align="center" gap={8} justify="end">
        <Image src="/images/olas-token-logo.svg" alt="OLAS" width={16} height={16} />
        <Text>{formatWeiNumber({ value: availableRewards })}</Text>
      </Flex>
    ),
    className: 'text-end',
    width: 140,
  },
  {
    title: 'Stake required, OLAS',
    dataIndex: 'stakeRequired',
    key: 'stakeRequired',
    render: (stakeRequired) => (
      <Flex align="center" gap={8} justify="end">
        <Image src="/images/olas-token-logo.svg" alt="OLAS" width={16} height={16} />
        <Text>{stakeRequired ?? NA}</Text>
      </Flex>
    ),
    className: 'text-end',
    width: 140,
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
            <RunAgentButton availableOn={type} key={type} type="text" />
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
  const [activeTab, setActiveTab] = useState<string>(TAB_LIVE);
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [platformFilters, setPlatformFilters] = useState<AvailableOn[]>([]);

  const filteredContracts = useMemo(() => {
    let list =
      activeTab === TAB_LIVE
        ? contracts.filter(isLiveContract)
        : contracts.filter((c) => !isLiveContract(c));

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) => {
        const name = (c.metadata?.name ?? '').toLowerCase();
        const chain = (CHAIN_NAMES[c.chainId] ?? '').toLowerCase();
        return name.includes(q) || chain.includes(q);
      });
    }

    if (chainFilter && chainFilter !== 'all') {
      const chainIdNum = Number(chainFilter);
      list = list.filter((c) => c.chainId === chainIdNum);
    }

    if (activeTab === TAB_LIVE && platformFilters.length > 0) {
      list = list.filter((c) => c.availableOn?.some((p) => platformFilters.includes(p)));
    }

    return list;
  }, [contracts, activeTab, searchQuery, chainFilter, platformFilters]);

  const columns = useMemo(() => getTableColumns(), []);

  return (
    <StyledMain>
      <FilterDropdownStyles />
      <StyledCard>
        <Title level={3} className="mt-0 mb-8">
          Staking contracts
        </Title>
        <Caption className="block mb-24">
          Browse staking opportunities and start running them via Pearl or Quickstart for the
          opportunity to earn OLAS rewards.
        </Caption>

        <LiveNotAvailableSwitch
          value={activeTab}
          onChange={(v) => setActiveTab(String(v))}
          options={TAB_OPTIONS}
        />

        {activeTab === TAB_NOT_AVAILABLE && (
          <Alert
            type="info"
            message={
              <>
                Know some of the staking contracts here are available?{' '}
                <a href={OPERATE_REPO_URL} target="_blank" rel="noreferrer">
                  Open a PR on GitHub {UNICODE_SYMBOLS.EXTERNAL_LINK}
                </a>{' '}
                and add it.
              </>
            }
            className="mb-16"
          />
        )}
        <FilterRow className="mb-16">
          <Input
            prefix={<SearchOutlined className="site-form-item-icon" />}
            placeholder="Search contracts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Select
            value={chainFilter}
            onChange={setChainFilter}
            options={CHAIN_OPTIONS}
            optionLabelProp="label"
            style={{ minWidth: 220 }}
            placeholder="All chains"
            allowClear
            popupClassName={FILTER_DROPDOWN_CLASS}
          />
          {activeTab === TAB_LIVE && (
            <PlatformSelectWrap>
              <Select
                className={PLATFORM_SELECT_CLASS}
                mode="multiple"
                value={platformFilters}
                onChange={setPlatformFilters}
                options={PLATFORM_OPTIONS}
                style={{ minWidth: 220 }}
                placeholder="All platforms"
                popupClassName={FILTER_DROPDOWN_CLASS}
                maxTagCount={1}
              />
              {platformFilters.length === 0 && (
                <PlatformSelectLabel>All platforms</PlatformSelectLabel>
              )}
            </PlatformSelectWrap>
          )}
        </FilterRow>

        <TableWrapper>
          <Table<StakingContract>
            columns={columns}
            pagination={false}
            loading={isLoading}
            dataSource={filteredContracts}
            expandable={{
              expandIcon: ({ expanded, onExpand, record }) => {
                const Icon = expanded ? DownOutlined : RightOutlined;
                return (
                  <Icon
                    style={{ fontSize: '14px', color: COLOR.TEXT_SECONDARY }}
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
                  <a
                    href={`${GOVERN_URL}/contracts/${record.address}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View full contract details {UNICODE_SYMBOLS.EXTERNAL_LINK}
                  </a>
                </>
              ),
            }}
            scroll={{ x: 1000 }}
            rowHoverable={false}
          />
        </TableWrapper>
      </StyledCard>
    </StyledMain>
  );
};
