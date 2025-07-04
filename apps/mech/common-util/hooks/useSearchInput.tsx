import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';
import { useState } from 'react';

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
      <Button ghost type="primary" size="large" onClick={() => setSearchValue(value || '')}>
        Search
      </Button>
    </Flex>
  );

  return { searchValue, searchInput, clearSearch };
};
