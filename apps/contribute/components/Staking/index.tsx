import { Alert, Card, Typography } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import { areAddressesEqual } from 'libs/util-functions/src';

import { ConnectWallet } from './ConnectWallet';
import { StakingStepper } from './StakingStepper';
import { useAppSelector } from 'store/setup';

const { Title } = Typography;

const Root = styled.div`
  max-width: 640px;
  margin: auto;
`;

export const StakingPage = () => {
  const leaderboard = useAppSelector((state) => state?.setup?.leaderboard);
  const account = useAppSelector((state) => state?.setup?.account);

  const xProfile = useMemo(() => {
    if (!account) return null;
    return leaderboard.find((item) => areAddressesEqual(item.wallet_address, account)) ?? null;
  }, [account, leaderboard]);

  return (
    <Root>
      <Card bordered={false}>
        <Alert
          type="warning"
          showIcon
          className="mb-16"
          message="Contribute staking is temporarily unavailable. New sign-ups are not available at this time."
        />
        <Title level={4}>Set up staking</Title>
        {account ? <StakingStepper profile={xProfile} /> : <ConnectWallet />}
      </Card>
    </Root>
  );
};
