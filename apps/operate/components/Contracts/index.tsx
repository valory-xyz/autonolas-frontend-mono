import { DownOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Input, Select, Segmented, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { AvailableOn, StakingContract } from 'types';

import { Caption, TextWithTooltip } from 'libs/ui-components/src';
import { CHAIN_NAMES, GOVERN_URL, NA, REPO_URL, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { formatWeiNumber } from 'libs/util-functions/src';

import { RunAgentButton } from 'components/RunAgentButton';

import { useStakingContractsList } from './hooks';

const StyledMain = styled.main`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 32px;
  margin: 0 auto;

  @media (min-width: 2560px) {
    max-width: 1400px;
  }
`;

const StyledCard = styled(Card)`
  border-width: 16px;
`;

const TableWrapper = styled.div`
  .ant-table-thead > tr > th {
    white-space: nowrap;
  }
`;

const FILTER_CONTROL_HEIGHT = 32;

const FilterRow = styled(Flex)`
  font-size: 14px;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  .ant-input-affix-wrapper,
  .ant-select-selector,
  .ant-tag {
    padding: 8px 12px !important;
    font-size: 14px;
  }
  .ant-input-affix-wrapper,
  .ant-select .ant-select-selector {
    height: ${FILTER_CONTROL_HEIGHT}px !important;
    min-height: ${FILTER_CONTROL_HEIGHT}px !important;
    display: flex !important;
    align-items: center !important;
  }
  .ant-select-single .ant-select-selector {
    padding: 8px 12px !important;
  }
`;

const FILTER_DROPDOWN_CLASS = 'contracts-filter-select-dropdown';

const PLATFORM_SELECT_CLASS = 'contracts-platform-select';

const PlatformSelectWrap = styled.div`
  position: relative;
  min-width: 220px;

  .${PLATFORM_SELECT_CLASS}.ant-select .ant-select-selector {
    padding: 2px 8px !important;
    height: ${FILTER_CONTROL_HEIGHT}px !important;
    min-height: ${FILTER_CONTROL_HEIGHT}px !important;
  }
  .${PLATFORM_SELECT_CLASS}.ant-select .ant-select-selection-placeholder {
    visibility: hidden;
  }
  .${PLATFORM_SELECT_CLASS}.ant-select-multiple .ant-select-selection-item {
    padding: 2px 8px !important;
    margin-inline-end: 4px !important;
  }
`;

const PlatformSelectLabel = styled.span`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  ${PlatformSelectWrap}:has(.ant-select-open) & {
    color: rgba(0, 0, 0, 0.25);
  }
`;

const FilterDropdownStyles = createGlobalStyle`
  .${FILTER_DROPDOWN_CLASS} .ant-select-item {
    padding: 8px 12px !important;
    font-size: 14px;
    min-height: unset;
  }
  .${FILTER_DROPDOWN_CLASS} .ant-select-item-option-content {
    display: flex;
    align-items: center;
  }
`;

const LiveNotAvailableSwitch = styled(Segmented)`
  background: #e0e3eb !important;
  border-radius: 8px !important;
  margin-bottom: 16px !important;

  .ant-segmented-group {
    background: transparent !important;
  }
  .ant-segmented-thumb {
    background: #ffffff !important;
    border-radius: 6px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .ant-segmented-item {
    color: #6c757d !important;
    border-radius: 6px !important;
  }
  .ant-segmented-item-selected {
    color: #333333 !important;
  }
  .ant-segmented-item-label {
    padding: 6px 16px;
  }
`;

const { Title, Paragraph, Text } = Typography;

const TAB_LIVE = 'live';
const TAB_NOT_AVAILABLE = 'not-available';

const FILTER_CHAIN_IDS = [100, 10, 8_453, 34_443, 137] as const;

const CHAIN_LOGOS: Partial<Record<number, string>> = {
  10: '/images/optimism-logo.svg',
  100: '/images/gnosis-logo.svg',
  8_453: '/images/base-logo.svg',
  137: '/images/polygon-logo.svg',
  34_443: '/images/mode-logo.svg',
};

const PLATFORM_OPTIONS: { value: AvailableOn; label: string }[] = [
  { value: 'pearl', label: 'Pearl' },
  { value: 'quickstart', label: 'Quickstart' },
  { value: 'contribute', label: 'Contribute' },
];

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
              <Image src={logoSrc} alt="" width={20} height={20} style={{ flexShrink: 0 }} />
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

    if (platformFilters.length > 0) {
      list = list.filter((c) => c.availableOn?.some((p) => platformFilters.includes(p)));
    }

    return list;
  }, [contracts, activeTab, searchQuery, chainFilter, platformFilters]);

  const columns = useMemo(() => getTableColumns(), []);

  const chainOptions = useMemo(
    () => [
      { value: 'all', label: 'All chains' },
      ...FILTER_CHAIN_IDS.map((chainId) => {
        const name = CHAIN_NAMES[String(chainId)] ?? String(chainId);
        const logoSrc = CHAIN_LOGOS[chainId];
        return {
          value: String(chainId),
          label: (
            <Flex align="center" gap={8}>
              {logoSrc && <Image src={logoSrc} alt="" width={16} height={16} />}
              <span>{name}</span>
            </Flex>
          ),
        };
      }),
    ],
    [],
  );

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
          options={[
            { label: 'Live', value: TAB_LIVE },
            { label: 'Not available', value: TAB_NOT_AVAILABLE },
          ]}
        />

        {activeTab === TAB_NOT_AVAILABLE && (
          <Alert
            type="info"
            message={
              <>
                Know some of the staking contracts here are available?{' '}
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  Open a PR on GitHub {UNICODE_SYMBOLS.EXTERNAL_LINK}
                </a>{' '}
                and add it.
              </>
            }
            showIcon
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
            options={chainOptions}
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
                onChange={(v: AvailableOn[]) => setPlatformFilters(v ?? [])}
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
        </TableWrapper>
      </StyledCard>
    </StyledMain>
  );
};
