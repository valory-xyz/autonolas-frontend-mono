import { useState } from 'react';
import { Button, Row, Col } from 'antd/lib';
import {
  getFormattedNumber,
  getFormattedDate,
  getCommaSeparatedNumber,
  getFullFormattedDate,
  notifySuccess,
  notifyError,
} from 'common-util/functions';
import { InfoCard } from 'common-util/InfoCard';
import { withdrawRequest } from '../contractUtils';
import { useFetchBuolasBalances } from '../hooks';

export const BuolasManage = () => {
  const {
    account,
    chainId,
    buolasBalance,
    buolasReleasableAmount,
    mappedBalances,
    buolasNextReleasableAmount,
    buolasNextReleasableTime,
    getData,
  } = useFetchBuolasBalances();

  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  // uncomment this to revoke all vested amount (just for testing)
  // useEffect(() => {
  //   if (account && chainId) {
  //     revokeRequest({ account, chainId });
  //   }
  // }, [account, chainId]);

  const onWithdraw = async () => {
    if (account && chainId) {
      setIsWithdrawLoading(true);
      try {
        await withdrawRequest({ account, chainId });
        notifySuccess('Claimed successfully!');

        // fetch all the data again to update
        getData();
      } catch (error) {
        window.console.error(error);
        notifyError();
      } finally {
        setIsWithdrawLoading(false);
      }
    }
  };

  return (
    <>
      <Row align="top">
        <Col lg={4} md={24} xs={24}>
          <InfoCard
            title="Your balance"
            value={getFormattedNumber(buolasBalance)}
            tooltipValue={getCommaSeparatedNumber(buolasBalance)}
            subText="buOLAS"
          />
        </Col>

        <Col lg={4} md={24} xs={24}>
          <InfoCard
            value={getFormattedNumber(buolasReleasableAmount)}
            tooltipValue={getCommaSeparatedNumber(buolasReleasableAmount)}
            subText="Vested amount"
          />
          <Button
            disabled={isWithdrawLoading || buolasReleasableAmount <= 0}
            onClick={onWithdraw}
            loading={isWithdrawLoading}
          >
            Claim all
          </Button>
        </Col>

        <Col lg={6} md={24} xs={24}>
          <InfoCard
            value={getFormattedDate(mappedBalances?.startTime)}
            tooltipValue={getFullFormattedDate(mappedBalances?.startTime)}
            subText="Vesting time"
          />
        </Col>

        <Col lg={6} md={24} xs={24}>
          <InfoCard
            value={getFormattedDate(mappedBalances?.endTime)}
            tooltipValue={getFullFormattedDate(mappedBalances?.endTime)}
            subText="Time to vest"
          />
        </Col>
      </Row>

      {/* Next releasable amount and time */}
      <Row align="top" style={{ marginTop: '1rem' }}>
        <Col lg={4} md={24} xs={24}>
          <InfoCard
            title="Next vesting"
            value={getFormattedNumber(buolasNextReleasableAmount)}
            tooltipValue={getCommaSeparatedNumber(buolasNextReleasableAmount)}
            subText="amount"
          />
        </Col>

        <Col lg={6} md={24} xs={24}>
          <InfoCard
            value={getFormattedDate(buolasNextReleasableTime)}
            tooltipValue={getFullFormattedDate(buolasNextReleasableTime)}
            subText="time"
          />
        </Col>
      </Row>
    </>
  );
};
