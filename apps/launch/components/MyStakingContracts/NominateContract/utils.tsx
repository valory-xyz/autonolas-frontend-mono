import { Alert, Button, Card, Flex, Spin, Typography } from 'antd';
import React, { FC, ReactNode } from 'react';

import { LogoSvg } from '../../Layout/Logos';
import { LoginV2 } from '../../Login';
import { LogoContainer, StyledMain } from './styles';

const { Title, Text } = Typography;

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

export const ContractDoesNotExist = () => (
  <Container>
    <Title level={4}>Contract not found...</Title>
    <Text>
      We couldn’t find the staking contract you’re referring to. Go to your staking contracts and
      try again.
    </Text>

    <Flex align="center" justify="center">
      {/* TODO: Fix redirect */}
      <Button href="/my-staking-contracts" className="mt-24" type="primary" ghost>
        View my staking contracts
      </Button>
    </Flex>
  </Container>
);

export const SwitchNetworkError = () => (
  <Alert message="Please switch to the mainnet to nominate a contract." type="error" showIcon />
);

export const ContractAlreadyNominated: FC<{ name: string }> = ({ name }) => (
  <Container>
    <Title level={4}>Contract has already been nominated</Title>
    <Flex vertical gap={14}>
      <Text>Contract {name}</Text>
      <Text type="secondary">
        The contract has already been nominated. You can close this page now.
      </Text>
    </Flex>

    {/* TODO: Fix redirect */}
    <Flex align="center" justify="center">
      <Button href="/my-staking-contracts" className="mt-24" type="primary" ghost>
        View my staking contracts
      </Button>
    </Flex>
  </Container>
);

export const ConnectWalletBeforeNominate: FC<{ name: string }> = ({ name }) => (
  <Container>
    <Title level={4}>Connect your wallet to nominate...</Title>
    <Flex vertical gap={14}>
      <Text>Contract {name}</Text>
      <Text type="secondary">
        The contract has already been nominated. You can close this page now.
      </Text>
    </Flex>

    <Alert
      message="Connect the wallet to nominate the staking contract."
      type="info"
      showIcon
      className="mt-24 mb-24"
    />

    <Flex align="center" justify="center">
      <LoginV2 />
    </Flex>
  </Container>
);

/************************ util functions ************************/
