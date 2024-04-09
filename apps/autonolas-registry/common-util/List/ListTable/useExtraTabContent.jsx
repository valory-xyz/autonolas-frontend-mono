import { useState } from 'react';
import { Input, Button, Typography, Tooltip } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { NAV_TYPES } from '../../../util/constants';

const { Title } = Typography;

const SearchUl = styled.ul`
  margin: 0;
  padding: 0 0 0 16px;
`;

export const useExtraTabContent = ({
  title,
  onRegisterClick,
  isSvm = false,
  type,
}) => {
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
        {/* TODO: hiding search util feature is introduced */}
        {isSvm ? null : (
          <>
            <Input
              prefix={<SearchOutlined className="site-form-item-icon" />}
              placeholder="Search..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && setSearchValue(value || '')
              }
              suffix={
                <Tooltip
                  title={
                    <div>
                      <div>Search by:</div>
                      <SearchUl>
                        <li>Name</li>
                        {type !== NAV_TYPES.SERVICE && <li>Description</li>}
                        <li>Owner</li>
                        <li>Package Hash</li>
                      </SearchUl>
                    </div>
                  }
                >
                  <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                </Tooltip>
              }
            />

            <Button
              ghost
              type="primary"
              onClick={() => setSearchValue(value || '')}
            >
              Search
            </Button>
          </>
        )}

        <Button type="primary" onClick={onRegisterClick}>
          Mint
        </Button>
      </>
    ),
  };

  return { searchValue, extraTabContent, clearSearch };
};
