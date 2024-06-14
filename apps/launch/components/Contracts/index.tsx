import { Flex } from 'antd';

import styled from 'styled-components';


const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

export const ContractsPage = () => {
  return (
    <StyledMain>
      <Flex gap={24}>
        Hello launch!
      </Flex>
    </StyledMain>
  );
};
