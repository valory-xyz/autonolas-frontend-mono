import { TableOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { match } from 'ts-pattern';
import { useAccount } from 'wagmi';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { CHAIN_NAMES } from 'libs/util-constants/src';

import { URL } from 'common-util/constants/urls';
import { useAppSelector } from 'store/index';

import { LoginV2 } from '../Login';

const { Title, Paragraph } = Typography;

const ICON_STYLE = { fontSize: '56px', color: '#A3AEBB' };

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
`;

const ConnectWallet = () => {
  return (
    <Flex align="center" vertical gap={16}>
      <WalletOutlined style={ICON_STYLE} />
      <Paragraph type="secondary" className="text-center">
        Connect your wallet to allocate your voting power.
      </Paragraph>
      <LoginV2 />
    </Flex>
  );
};

const StakingContractList = () => {
  const router = useRouter();

  return (
    <Flex align="center" vertical gap={16} className="mb-24 mt-48">
      <TableOutlined style={ICON_STYLE} />
      <Paragraph type="secondary" className="text-center">
        You haven’t created any staking contracts yet.
      </Paragraph>
      <Button type="primary" onClick={() => router.push(`${URL.myStakingContract}/create`)}>
        Create staking contract
      </Button>
    </Flex>
  );
};

export const MyStakingContracts = () => {
  const { networkId } = useAppSelector((state) => state.network);

  const { isConnected: isAccountConnected } = useAccount();

  return (
    <StyledMain>
      <Link href="/my-staking-contracts" target="_blank">
        Explore all nominated staking contracts on Olas Govern&nbsp;
        {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Link>

      <Card className="flex-none mt-24">
        <Title level={3} className="m-0">
          My staking contracts
          {isAccountConnected && networkId && <>&nbsp;on {CHAIN_NAMES[networkId]}</>}
        </Title>

        <Paragraph type="secondary" className="mt-8 mb-16">
          Create staking contracts to get agents running in your ecosystem.
        </Paragraph>

        {/* TODO: Tanya to add staking contracts list */}
        {match(isAccountConnected)
          .with(true, () => <StakingContractList />)
          .with(false, () => <ConnectWallet />)
          .exhaustive()}
      </Card>
    </StyledMain>
  );
};
