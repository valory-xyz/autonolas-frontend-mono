import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Spin, Typography } from 'antd';
import Link from 'next/link';
import React, { FC, ReactNode } from 'react';

import { useAppSelector } from 'store/index';

import { LogoSvg } from '../Layout/Logos';
import { LoginV2 } from '../Login';
import { GreenDot, LogoContainer, PurpleDot, RedDot, StyledMain } from './styles';

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

export const ContractDoesNotExist = () => {
  const { networkName } = useAppSelector((state) => state.network);
  return (
    <Container>
      <Title level={4}>Contract not found...</Title>
      <Text>
        We couldn’t find the staking contract you’re referring to. Go to your staking contracts and
        try again.
      </Text>

      <Flex align="center" justify="center">
        <Link href={`/${networkName}/my-staking-contracts`} passHref>
          <Button className="mt-24" type="primary" ghost>
            View my staking contracts
          </Button>
        </Link>
      </Flex>
    </Container>
  );
};

export const SwitchNetworkError = () => (
  <Alert message="Please switch to the mainnet to nominate a contract." type="error" showIcon />
);

export const ContractAlreadyNominated: FC<{ contractName: string }> = ({ contractName }) => {
  const { networkName } = useAppSelector((state) => state.network);
  return (
    <Container>
      <Title level={4}>Contract has already been nominated</Title>
      <Flex vertical gap={14}>
        <Text>{contractName}</Text>
        <Text type="secondary">
          The contract has already been nominated. You can close this page now.
        </Text>
      </Flex>

      <Flex align="center" justify="center">
        <Link href={`/${networkName}/my-staking-contracts`} passHref>
          <Button className="mt-24" type="primary" ghost>
            View my staking contracts
          </Button>
        </Link>
      </Flex>
    </Container>
  );
};

export const ConnectWalletBeforeNominate: FC<{ contractName: string }> = ({ contractName }) => (
  <Container>
    <Title level={4}>Connect your wallet to nominate...</Title>
    <Flex vertical gap={14}>
      <Text>{contractName}</Text>
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

export const WaitingForTransaction = ({ contractName }: { contractName: string }) => (
  <>
    <Title level={4}>Nominating staking contract...</Title>
    <Text>{contractName}</Text>

    <Flex align="center" className="mt-16">
      <PurpleDot />
      <Text>&nbsp;Waiting for transaction...</Text>
    </Flex>
  </>
);

export const SuccessfulTransaction = ({ contractName }: { contractName: string }) => (
  <>
    <Title level={4}>Contract has been nominated</Title>
    <Text>{contractName}</Text>

    <Flex align="center" className="mt-16 mb-16">
      <GreenDot />
      <Text>&nbsp;Transaction successful</Text>
    </Flex>

    <Text type="secondary">You will be redirected to the previous page shortly...</Text>
  </>
);

type ErrorTransactionProps = {
  contractName: string;
  errorTitle?: string;
  errorInfo: ReactNode;
  onRetry?: () => void;
};
export const ErrorTransaction: FC<ErrorTransactionProps> = ({
  contractName,
  errorTitle,
  errorInfo,
  onRetry,
}) => (
  <>
    <Title level={4}>Contract hasn’t been nominated</Title>
    <Text>{contractName}</Text>

    <Flex align="center" className="mt-20 mb-20">
      <RedDot />
      <Text>&nbsp;{errorTitle || 'Transaction failed'}</Text>
    </Flex>

    {errorInfo}

    {onRetry && (
      <Flex justify="center">
        <Button onClick={onRetry} type="primary" ghost>
          <ReloadOutlined /> Try again
        </Button>
      </Flex>
    )}
  </>
);

/************************ util functions ************************/
