import { Button, Col, Row } from 'antd';
import { useState } from 'react';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { withdrawVeolasRequest } from 'common-util/functions';
import { useFetchBalances } from 'hooks/index';

import {
  BalanceComponent,
  LockedAmountComponent,
  UnlockTimeComponent,
  UnlockedAmountComponent,
  VotingPercentComponent,
  VotingPowerComponent,
} from './VeOlasComponents';

export const VeOlasManage = () => {
  const {
    isLoading,
    olasBalance,
    votingPower,
    totalSupply,
    veOlasBalance,
    lockedEnd,
    canWithdrawVeolas,
    account,
    refetch,
  } = useFetchBalances();

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
        <Col span={8}>
          <BalanceComponent isLoading={isLoading} olasBalance={olasBalance} />
        </Col>

        <Col span={8}>
          <VotingPowerComponent isLoading={isLoading} votingPower={votingPower} />
        </Col>

        <Col span={8}>
          <VotingPercentComponent
            isLoading={isLoading}
            votingPower={votingPower}
            totalSupply={totalSupply}
          />
        </Col>

        <Col span={8}>
          <LockedAmountComponent isLoading={isLoading} veOlasBalance={veOlasBalance} />
        </Col>

        <Col span={8}>
          <UnlockTimeComponent isLoading={isLoading} lockedEnd={lockedEnd} />

          {!isLoading && canWithdrawVeolas && (
            <Button htmlType="submit" onClick={onWithdraw} loading={isWithdrawLoading}>
              Claim all
            </Button>
          )}
        </Col>

        <Col span={8}>
          <UnlockedAmountComponent
            isLoading={isLoading}
            veOlasBalance={veOlasBalance}
            canWithdrawVeolas={canWithdrawVeolas}
          />
        </Col>
      </Row>
    </>
  );
};
