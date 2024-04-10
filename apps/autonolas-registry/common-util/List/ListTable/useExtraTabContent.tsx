import { useState } from 'react';
import { Input, Button, Typography, Tooltip } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { useHelpers } from '../../hooks';

const { Title } = Typography;

const SearchUl = styled.ul`
  margin: 0;
  padding: 0 0 0 16px;
`;

type UseExtraTabContentProps = {
  title: string;
  onRegisterClick?: () => void;
  isSvm?: boolean;
  type: string;
  isMyTab: boolean;
};

export const useExtraTabContent = ({
  title,
  onRegisterClick,
  isSvm = false,
  type,
  isMyTab = true,
}: UseExtraTabContentProps) => {
  const { account } = useHelpers();

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
        {isSvm || (isMyTab && !account) ? null : (
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
                        <li>Description</li>
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
