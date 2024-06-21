import { Alert, Card, Flex, Spin } from 'antd';
import React, { ReactNode } from 'react';

import { LogoSvg } from '../../Layout/Logos';
import { LogoContainer, StyledMain } from './styles';

/************************ Presentational Components ************************/

export const Container = ({ children }: { children: ReactNode }) => {
  return (
    <StyledMain>
      <Card>
        <LogoContainer>
          <LogoSvg />
        </LogoContainer>

        {children}
      </Card>
    </StyledMain>
  );
};

export const Loader = () => (
  <Container>
    <Flex align="center" justify="center" style={{ height: 240 }}>
      <Spin />
    </Flex>
  </Container>
);

export const SwitchNetworkError = () => (
  <Alert message="Please switch to the mainnet to nominate a contract." type="error" showIcon />
);

export const ContractAlreadyNominated = () => (
  <Alert message="Contract is already nominated." type="error" showIcon />
);

export const ConnectWalletBeforeNominate = () => (
  <Alert message="Please connect your wallet to nominate a contract." type="error" showIcon />
);

/************************ util functions ************************/
