import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';
import { useState } from 'react';

import { AddressLink, NA } from '@autonolas/frontend-library';

import { SUPPORTED_CHAINS } from 'common-util/Login';
import { FIRST_SUPPORTED_CHAIN } from 'common-util/Login/config';
import { NAV_TYPES, REGISTRY_URL, TOTAL_VIEW_COUNT } from 'util/constants';

export const getTableColumns = (type, { router, isMobile }) => {
  const networkName = router?.query?.network ?? FIRST_SUPPORTED_CHAIN.networkName;

  if (type === NAV_TYPES.COMPONENT || type === NAV_TYPES.AGENT) {
    return [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 50,
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
        width: 250,
        render: (text) => (
          <AddressLink
            text={text}
            suffixCount={isMobile ? 4 : 6}
            canCopy
            textMinWidth={160}
            supportedChains={SUPPORTED_CHAINS}
          />
        ),
      },
      {
        title: 'Hash',
        dataIndex: 'hash',
        key: 'hash',
        width: 200,
        render: (text) => (
          <AddressLink
            text={text}
            textMinWidth={320}
            suffixCount={isMobile ? 4 : 14}
            isIpfsLink
            canCopy
          />
        ),
      },
      {
        title: 'Mech',
        dataIndex: 'mech',
        width: 180,
        key: 'mech',
        render: (text, row) => {
          if (!text) return NA;
          return (
            <AddressLink
              text={text}
              textMinWidth={320}
              suffixCount={isMobile ? 4 : 14}
              canCopy
              onClick={(e) => {
                if (router) router.push(`/${networkName}/mech/${e}/${row.hash}?legacy=true`);
              }}
            />
          );
        },
      },
    ];
  }

  if (type === NAV_TYPES.SERVICE) {
    return [
      {
        title: 'Service ID',
        dataIndex: 'id',
        key: 'id',
        width: 50,
        render: (text) => (
          <a href={`${REGISTRY_URL}/gnosis/services/${text}`} target="_blank" rel="noreferrer">
            {text}
          </a>
        ),
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
        width: 160,
        render: (text) => (
          <AddressLink
            text={text}
            suffixCount={isMobile ? 4 : 6}
            canCopy
            textMinWidth={160}
            supportedChains={SUPPORTED_CHAINS}
          />
        ),
      },
      {
        title: 'Hash',
        dataIndex: 'hash',
        key: 'hash',
        width: 180,
        render: (text) => (
          <AddressLink
            text={text}
            textMinWidth={240}
            suffixCount={isMobile ? 4 : 14}
            isIpfsLink
            canCopy
          />
        ),
      },
      {
        title: 'Mech',
        dataIndex: 'mech',
        width: 180,
        key: 'mech',
        render: (text) => {
          if (!text) return NA;
          return (
            <AddressLink
              text={text}
              textMinWidth={240}
              suffixCount={isMobile ? 4 : 14}
              canCopy
              onClick={() => {
                if (router) router.push(`/${networkName}/mech/${text}`);
              }}
            />
          );
        },
      },
      {
        title: 'Mech Factory',
        dataIndex: 'mechFactory',
        width: 220,
        key: 'mechFactory',
        render: (text) => (
          <AddressLink
            text={text}
            suffixCount={isMobile ? 4 : 14}
            canCopy
            textMinWidth={240}
            supportedChains={SUPPORTED_CHAINS}
          />
        ),
      },
    ];
  }

  return [];
};

export const getData = (type, rawData, { current }) => {
  /**
   * @example
   * TOTAL_VIEW_COUNT = 10, current = 1
   * start = ((1 - 1) * 10) + 1
   *       = (0 * 10) + 1
   *       = 1
   * TOTAL_VIEW_COUNT = 10, current = 1
   * start = ((5 - 1) * 10) + 1
   *       = 40 + 1
   *       = 41
   */
  const startIndex = (current - 1) * TOTAL_VIEW_COUNT + 1;
  let data = [];

  if (type === NAV_TYPES.AGENT) {
    data = rawData.map((item, index) => ({
      id: item.id || `${startIndex + index}`,
      description: item.description || '-',
      developer: item.developer || '-',
      owner: item.owner || '-',
      hash: item.hash || '-',
      mech: item.mech,
      dependency: (item.dependencies || []).length,
    }));
  }

  if (type === NAV_TYPES.SERVICE) {
    data = rawData.map((item) => ({
      id: item.id,
      owner: item.owner || '-',
      hash: item.hash || '-',
      mech: item.address,
      mechFactory: item.mechFactory,
    }));
  }

  return data;
};

/**
 * tab content
 */
export const useSearchInput = () => {
  const [searchValue, setSearchValue] = useState('');
  const [value, setValue] = useState('');
  const clearSearch = () => {
    setValue('');
    setSearchValue('');
  };

  const searchInput = (
    <Flex gap={8}>
      <Input
        prefix={<SearchOutlined className="site-form-item-icon" />}
        placeholder="Owner or Hash"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button ghost type="primary" onClick={() => setSearchValue(value || '')}>
        Search
      </Button>
    </Flex>
  );

  return { searchValue, searchInput, clearSearch };
};

/**
 * returns hash from the url
 * @example
 * input: router-path (for example, /components#my-components)
 * output: my-components
 */
export const getHash = (router) => router?.asPath?.split('#')[1] || '';

/**
 * my-components/my-agents/my-serices has "my" in common hence returns
 */
export const isMyTab = (hash) => !!(hash || '').includes('my-');
