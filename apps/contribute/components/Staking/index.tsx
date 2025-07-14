// @ts-nocheck TODO: provide types for useSelector
import { Card, Typography } from 'antd';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { areAddressesEqual } from '@autonolas/frontend-library';

import { ConnectWallet } from './ConnectWallet';
import { StakingStepper } from './StakingStepper';

const { Title, Text } = Typography;

const Root = styled.div`
  max-width: 640px;
  margin: auto;
`;

export const StakingPage = () => {
  const leaderboard = useSelector((state) => state?.setup?.leaderboard);
  const account = useSelector((state) => state?.setup?.account);

  const xProfile = useMemo(() => {
    return leaderboard.find((item) => areAddressesEqual(item.wallet_address, account));
  }, [account, leaderboard]);

  return (
    <Root>
      <Card bordered={false}>
        <Title level={4}>Set up staking</Title>
        {account ? <StakingStepper profile={xProfile} /> : <ConnectWallet />}
      </Card>
    </Root>
  );
};
