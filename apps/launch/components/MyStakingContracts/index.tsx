import { TableOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Spin, Typography } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';
import { match } from 'ts-pattern';
import { useAccount } from 'wagmi';

import { CHAIN_NAMES, GOVERN_URL, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { URL } from 'common-util/constants/urls';
import { useAppSelector } from 'store/index';

import { useMyStakingContracts, useRetryMyStakingContracts } from 'hooks/useMyStakingContracts';

import { LoginV2 } from '../Login';
import { List } from './List';

const { Title, Paragraph } = Typography;

const ICON_STYLE = { fontSize: '56px', color: '#A3AEBB' };

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
`;

const Loader = () => (
  <Flex justify="center" align="center" style={{ height: '40vh' }}>
    <Spin />
  </Flex>
);

const ConnectWallet = () => {
  return (
    <>
      <CreateContractMessage />
      <Flex align="center" vertical gap={16}>
        <WalletOutlined style={ICON_STYLE} />
        <Paragraph type="secondary" className="text-center">
          Connect your wallet to allocate your voting power.
        </Paragraph>
        <LoginV2 />
      </Flex>
    </>
  );
};

const CreateContractMessage = () => (
  <Paragraph type="secondary" className="mt-8 mb-16">
    Create staking contracts to get agents running in your ecosystem.
  </Paragraph>
);

const CreateContractButton = () => {
  const { networkName } = useAppSelector((state) => state.network);
  return (
    <Link href={`/${networkName}/${URL.myStakingContracts}/create`} passHref>
      <Button size="large" type="primary">
        Create staking contract
      </Button>
    </Link>
  );
};

const CreateStakingContractMessage = () => (
  <>
    <CreateContractMessage />
    <Flex align="center" vertical gap={16} className="mb-24 mt-48">
      <TableOutlined style={ICON_STYLE} />
      <Paragraph type="secondary" className="text-center">
        You haven’t created any staking contracts yet.
      </Paragraph>
      <CreateContractButton />
    </Flex>
  </>
);

/** Discovery failed: the account may well have contracts, so offer a retry, not "create one". */
const LookupFailedMessage = () => {
  const { retry, isRetrying } = useRetryMyStakingContracts();
  return (
    <Alert
      className="mt-16"
      type="warning"
      showIcon
      data-testid="my-staking-contracts-lookup-failed"
      message="Couldn’t load your staking contracts"
      description="The network didn’t respond. Your contracts are not affected; try again."
      action={
        <Button size="small" loading={isRetrying} onClick={() => retry()}>
          Retry
        </Button>
      }
    />
  );
};

const StakingContractList = () => {
  const { isMyStakingContractsLoading, myStakingContracts, isMyStakingContractsLookupFailed } =
    useMyStakingContracts();

  if (isMyStakingContractsLoading) return <Loader />;
  if (isMyStakingContractsLookupFailed) {
    // Contracts created this session can still be listed.
    return (
      <>
        <LookupFailedMessage />
        {myStakingContracts.length > 0 && <List />}
      </>
    );
  }
  if (myStakingContracts.length === 0) return <CreateStakingContractMessage />;
  return <List />;
};

export const MyStakingContracts = () => {
  const { isConnected: isAccountConnected } = useAccount();
  const { networkId } = useAppSelector((state) => state.network);

  return (
    <StyledMain>
      <Link href={GOVERN_URL} target="_blank">
        Explore all nominated staking contracts on Olas Govern&nbsp;
        {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Link>

      <Card className="flex-none mt-24">
        <Flex justify="space-between">
          <Title level={4} className="m-0">
            My staking contracts
            {isAccountConnected && networkId ? ` on ${CHAIN_NAMES[networkId]}` : ''}
          </Title>

          {isAccountConnected && <CreateContractButton />}
        </Flex>

        {match(isAccountConnected)
          .with(true, () => <StakingContractList />)
          .with(false, () => <ConnectWallet />)
          .exhaustive()}
      </Card>
    </StyledMain>
  );
};
