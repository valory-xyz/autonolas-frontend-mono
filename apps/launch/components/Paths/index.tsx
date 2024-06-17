import { Flex } from 'antd';
import styled from 'styled-components';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

export const PathsPage = () => {
  return (
    <StyledMain>
      <Flex gap={24}>Hello path!</Flex>
    </StyledMain>
  );
};
