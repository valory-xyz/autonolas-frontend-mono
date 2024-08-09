import { Alert, Button, Card, Space, Typography } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { useFetchBalances } from 'hooks/index';

import { CreateLockModal } from './CreateLockModal';
import { IncreaseLockModal } from './IncreaseLockModal';
import { VeOlasManage } from './VeOlasManage';

const { Paragraph } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 946px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 8px;
`;

export const VeOlasPage = () => {
  const { isLoading, canWithdrawVeolas, canIncreaseAmountOrUnlock } = useFetchBalances();

  const [isCreateLockModalVisible, setIsCreateLockModalVisible] = useState(false);
  const [isIncreaseModalVisible, setIsIncreaseModalVisible] = useState(false);

  return (
    <StyledMain>
      <Card>
        <Title>veOLAS</Title>
        <Paragraph type="secondary" className="mt-8 mb-24">
          veOLAS gives you voting power in Olas governance. Lock OLAS for longer periods to get more
          veOLAS.
        </Paragraph>
        <Space size="middle" className="mb-16">
          <Button
            type="primary"
            size="large"
            disabled={isLoading || !!canWithdrawVeolas}
            onClick={() => {
              // if the user has veolas, then show the modal to increase the amount
              // else show the modal to create a lock
              if (canIncreaseAmountOrUnlock) {
                setIsIncreaseModalVisible(true);
              } else {
                setIsCreateLockModalVisible(true);
              }
            }}
          >
            Lock OLAS for veOLAS
          </Button>

          {canWithdrawVeolas && (
            <Alert message="Please claim your OLAS before locking again" type="warning" showIcon />
          )}
        </Space>

        <VeOlasManage />

        <CreateLockModal
          isModalVisible={isCreateLockModalVisible}
          setIsModalVisible={setIsCreateLockModalVisible}
        />
        <IncreaseLockModal
          isModalVisible={isIncreaseModalVisible}
          setIsModalVisible={setIsIncreaseModalVisible}
        />
      </Card>
    </StyledMain>
  );
};
