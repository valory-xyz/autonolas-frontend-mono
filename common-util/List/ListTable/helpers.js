import { useState } from 'react';
import { Input, Button, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { AddressLink, NA } from '@autonolas/frontend-library';

import { NAV_TYPES, TOTAL_VIEW_COUNT } from 'util/constants';
import { SUPPORTED_CHAINS } from 'common-util/Login';

const { Title } = Typography;

export const getTableColumns = (type, { router, isMobile }) => {
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
                if (router) router.push(`/mech/${e}/${row.hash}`);
              }}
            />
          );
        },
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

  return data;
};

/**
 * tab content
 */
export const useExtraTabContent = ({ title }) => {
  const [searchValue, setSearchValue] = useState('');
  const [value, setValue] = useState('');
  const clearSearch = () => {
    setValue('');
    setSearchValue('');
  };

  const extraTabContent = {
    left: title ? <Title level={2}>{title}</Title> : null,
    right: (
      <>
        <Input
          prefix={<SearchOutlined className="site-form-item-icon" />}
          placeholder="Owner or Hash"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          ghost
          type="primary"
          onClick={() => setSearchValue(value || '')}
        >
          Search
        </Button>
      </>
    ),
  };

  return { searchValue, extraTabContent, clearSearch };
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
