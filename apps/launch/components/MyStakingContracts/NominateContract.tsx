import { Card, Flex, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

import { LogoSvg } from '../Layout/Logos';

const { Title, Paragraph, Text } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
`;

const LogoContainer = styled.div`
  margin: 0;
  text-align: center;
  scale: 1.4;
`;

const PurpleDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${COLOR.PRIMARY};
  display: inline-block;
  margin-right: 8px;
`;

// TODO: Tanya to check
export const NominatedContract = () => {
  return (
    <StyledMain>
      <Card>
        <LogoContainer>
          <LogoSvg />
        </LogoContainer>

        <Title level={4}>
          Nominating staking contract...
        </Title>
        <Paragraph>Contract #1 Create Prediction Market Modernized on Gnosis chain</Paragraph>

        <Flex align="center">
          <PurpleDot />
          <Text>&nbsp;Waiting for transaction...</Text>
        </Flex>
      </Card>
    </StyledMain>
  );
};
