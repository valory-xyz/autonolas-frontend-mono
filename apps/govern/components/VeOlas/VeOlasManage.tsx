import { Button, Col, Row } from 'antd';
import { useState } from 'react';

import { notifySuccess } from '@autonolas/frontend-library';

import { notifyError } from 'libs/util-functions/src';

import { withdrawVeolasRequest } from 'common-util/functions';
import { useFetchBalances } from 'hooks/index';

import { useVeolasComponents } from './useVeolasComponents';

export const VeOlasManage = () => {
  const { isLoading, canWithdrawVeolas, account, refetch } = useFetchBalances();
  const {
    getBalanceComponent,
    getVotingPowerComponent,
    getVotingPercentComponent,
    getLockedAmountComponent,
    getUnlockTimeComponent,
    getUnlockedAmountComponent,
  } = useVeolasComponents();

  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  const onWithdraw = async () => {
    if (!account) return;

    try {
      setIsWithdrawLoading(true);
      await withdrawVeolasRequest({ account });
      notifySuccess('Claimed successfully');

      refetch();
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  return (
    <>
      <Row>
        <Col span={8}>{getBalanceComponent()}</Col>

        <Col span={8}>{getVotingPowerComponent()}</Col>

        <Col span={8}>{getVotingPercentComponent()}</Col>

        <Col span={8}>{getLockedAmountComponent()}</Col>

        <Col span={8}>
          {getUnlockTimeComponent()}

          {!isLoading && canWithdrawVeolas && (
            <Button htmlType="submit" onClick={onWithdraw} loading={isWithdrawLoading}>
              Claim all
            </Button>
          )}
        </Col>

        <Col span={8}>{getUnlockedAmountComponent()}</Col>
      </Row>
    </>
  );
};
