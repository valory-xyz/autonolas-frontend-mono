import { useState } from 'react';
import {
  Input, Button, Typography, Tooltip,
} from 'antd/lib';
import { SearchOutlined, CopyOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { GATEWAY_URL, NAV_TYPES, TOTAL_VIEW_COUNT } from 'util/constants';

const { Text, Title } = Typography;
const textStyle = { maxWidth: '100%' };

/**
 * helper components
 */

export const getTrimmedText = (str, suffixCount) => {
  const text = str.trim();
  const frontText = text.slice(0, suffixCount);
  const backText = text.slice(text.length - suffixCount, text.length);
  return `${frontText}...${backText}`;
};

export const EllipsisMiddle = ({
  suffixCount,
  isEtherscanLink,
  children,
  ...rest
}) => {
  if (typeof children !== 'string') return <>{children}</>;

  if (children.length <= 12) return <Text {...rest}>{children}</Text>;

  const getText = () => {
    if (!isEtherscanLink) return children;
    const hash = children.substring(2);
    return `f01701220${hash}`;
  };

  const text = getText();
  const trimmedText = getTrimmedText(text, suffixCount, isEtherscanLink);

  /**
   * truncate only if the character exceeds more than 12
   */
  return (
    <Text style={textStyle} {...rest}>
      {isEtherscanLink ? (
        <a
          href={`${GATEWAY_URL}/${text}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {trimmedText}
        </a>
      ) : (
        trimmedText
      )}

      <Tooltip title="Copy">
        &nbsp;
        <Button
          onClick={() => navigator.clipboard.writeText(text)}
          icon={<CopyOutlined />}
        />
      </Tooltip>
    </Text>
  );
};

EllipsisMiddle.propTypes = {
  suffixCount: PropTypes.number,
  isEtherscanLink: PropTypes.bool,
  children: PropTypes.string,
};

EllipsisMiddle.defaultProps = {
  suffixCount: 6,
  isEtherscanLink: false,
  children: '',
};

/**
 * helper functions
 */

export const getTableColumns = (type) => {
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
        width: 160,
        render: (text) => <EllipsisMiddle>{text}</EllipsisMiddle>,
      },
      {
        title: 'Hash',
        dataIndex: 'hash',
        key: 'hash',
        width: 200,
        render: (text) => (
          <EllipsisMiddle isEtherscanLink suffixCount={14}>
            {text}
          </EllipsisMiddle>
        ),
      },
      {
        title: 'Mech',
        dataIndex: 'mech',
        width: 180,
        key: 'mech',
        render: (text) => <EllipsisMiddle>{text}</EllipsisMiddle>,
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
  if (type === NAV_TYPES.COMPONENT) {
    data = rawData.map((item, index) => ({
      id: item.id || `${startIndex + index}`,
      description: item.description || '-',
      developer: item.developer || '-',
      owner: item.owner || '-',
      hash: item.unitHash || '-',
      dependency: (item.dependencies || []).length,
    }));
  }

  if (type === NAV_TYPES.AGENT) {
    data = rawData.map((item, index) => ({
      id: item.id || `${startIndex + index}`,
      description: item.description || '-',
      developer: item.developer || '-',
      owner: item.owner || '-',
      hash: item.agentHashes[0] || '-',
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
    left: <Title level={2}>{title}</Title>,
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
