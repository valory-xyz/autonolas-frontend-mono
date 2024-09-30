import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';
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
  isMyTab = true,
}: UseExtraTabContentProps) => {
  const router = useRouter();
  const { account, isMainnet } = useHelpers();

  // search query is supported only in mainnet for now (as subgraph is available only in mainnet)
  const searchQuery = isMainnet ? (router.query.search ?? '') : '';

  const [searchValue, setSearchValue] = useState(searchQuery); // to control the search
  const [value, setValue] = useState(searchQuery); // to control the input field
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
              onKeyDown={(e) => e.key === 'Enter' && setSearchValue(value || '')}
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

            <Button size="large" ghost type="primary" onClick={() => setSearchValue(value || '')}>
              Search
            </Button>
          </>
        )}

        <Button size="large" type="primary" onClick={onRegisterClick}>
          Mint
        </Button>
      </>
    ),
  };

  return { searchValue, extraTabContent, clearSearch };
};
