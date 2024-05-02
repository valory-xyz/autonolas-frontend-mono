import { Flex, Tabs, Card, Typography } from 'antd';

import { SolanaWallet } from 'common-util/Login/SolanaWallet';
import styled from 'styled-components';
import { WsolDeposit } from './WsolDeposit';
import { WsolWithDraw } from './WsolWithdraw';

const { Title } = Typography;

const ManageSolanaTitle = styled(Title)`
  margin-bottom: 24px;
  text-align: center;
`;

export const WsolTokenManagement = () => {
  return (
    <>
      <ManageSolanaTitle level={4}>Manage Solana Liquidity</ManageSolanaTitle>

      <Card style={{ width: '500px', margin: '0 auto' }}>
        <Flex justify="space-between" align="center" gap={12}>
          <Tabs
            className="full-width"
            defaultActiveKey="deposit"
            tabBarExtraContent={<SolanaWallet />}
            items={[
              {
                key: 'deposit',
                label: 'Deposit',
                children: <WsolDeposit />,
              },
              {
                key: 'withdraw',
                label: 'Withdraw',
                children: <WsolWithDraw />,
              },
            ]}
          />
        </Flex>
      </Card>
    </>
  );
};
