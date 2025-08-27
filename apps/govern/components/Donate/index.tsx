import { Alert, Button, Card, Skeleton, Typography } from 'antd';
import { ethers } from 'ethers';
import isNumber from 'lodash/isNumber';
import Link from 'next/link';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { NA, getFullFormattedDate, notifySuccess } from '@autonolas/frontend-library';

import { notifyError } from 'libs/util-functions/src';

import {
  checkServicesTerminatedOrNotDeployed,
  checkpointRequest,
  depositServiceDonationRequest,
} from 'common-util/functions';

import { DonateForm } from './DonateForm';
import { useThresholdData } from './hooks';
import { DonateContainer, EpochCheckpointRow, EpochStatus } from './styles';
import { ClaimStakingIncentives } from './ClaimStakingIncentives';

const { Title, Paragraph, Text } = Typography;

const sortUnitIdsAndAmounts = (unitIds: number[], amounts: number[]) => {
  const sortedUnitIds = [...unitIds].sort((a, b) => a - b);
  const sortedAmounts = sortedUnitIds.map((e) => amounts[unitIds.indexOf(e)]);
  return [sortedUnitIds, sortedAmounts];
};

export const DonatePage = () => {
  const { address: account } = useAccount();

  const [isDonationLoading, setIsDonationLoading] = useState(false);
  const [isCheckpointLoading, setIsCheckpointLoading] = useState(false);

  const {
    isDataLoading,
    refetchData,
    veOLASThreshold,
    minAcceptedETH,
    epochCounter,
    prevEpochEndTime,
    epochLength,
    nextEpochEndTime,
  } = useThresholdData();

  const onDepositServiceDonationSubmit = async (values: {
    unitIds: number[];
    amounts: number[];
  }) => {
    if (!account) return;

    try {
      setIsDonationLoading(true);

      const [sortedUnitIds, sortedAmounts] = sortUnitIdsAndAmounts(values.unitIds, values.amounts);
      const serviceIds = sortedUnitIds.map((e) => `${e}`);
      const invalidServices = await checkServicesTerminatedOrNotDeployed(serviceIds);

      // deposit only if all services are deployed or not terminated
      if (invalidServices.length > 0) {
        throw new Error(
          `Provided service IDs are not deployed or terminated ${invalidServices.join(', ')}`,
        );
      } else {
        const amounts = sortedAmounts.map((e) => ethers.parseUnits(`${e}`, 18).toString());
        const totalAmount = amounts.reduce(
          (a, b) => ethers.toBigInt(a) + ethers.toBigInt(b),
          BigInt(0),
        );

        if (minAcceptedETH !== undefined && minAcceptedETH > totalAmount) {
          throw new Error(
            `At least ${ethers.formatEther(
              `${minAcceptedETH}`,
            )} ETH of donations is required to trigger boosts.`,
          );
        } else {
          const params = {
            account,
            serviceIds,
            amounts,
            totalAmount: totalAmount.toString(),
          };

          await depositServiceDonationRequest(params);
          notifySuccess('Deposited service donation successfully');
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage =
        (error as Error).message || 'Error occurred on depositing service donation';
      notifyError(errorMessage);
      throw error;
    } finally {
      setIsDonationLoading(false);
    }
  };

  const onCheckpoint = async () => {
    if (!account) return;

    try {
      setIsCheckpointLoading(true);
      await checkpointRequest({ account });
      await refetchData(); // update epoch details after checkpoint
      notifySuccess('Started new epoch');
    } catch (error) {
      console.error(error);
      notifyError('Error occurred on starting new epoch');
    } finally {
      setIsCheckpointLoading(false);
    }
  };

  const epochStatusList = [
    {
      text: 'Earliest possible expected end time',
      value: nextEpochEndTime ? getFullFormattedDate(nextEpochEndTime * 1000) : NA,
    },
    {
      text: 'Epoch length',
      value: isNumber(epochLength) ? `${epochLength / 3600 / 24} days` : NA,
    },
    {
      text: 'Previous epoch end time',
      value: prevEpochEndTime ? getFullFormattedDate(prevEpochEndTime * 1000) : NA,
    },
    {
      text: 'Epoch counter',
      value: epochCounter || NA,
    },
  ];

  // disable checkpoint button if expected end time is in the future
  const isExpectedEndTimeInFuture = (nextEpochEndTime || 0) * 1000 > Date.now();

  return (
    <DonateContainer>
      <Card className="donate-section">
        <Title level={2} className="mt-0">
          Donate
        </Title>
        <Paragraph>
          Show appreciation for the value of a decentralized AI by making a donation. The protocol
          will reward devs who have contributed code for that service.
        </Paragraph>

        <Alert
          showIcon
          type="info"
          message={
            <>
              To boost rewards of devs with freshly minted OLAS, you must hold at least&nbsp;
              <Text strong>{veOLASThreshold || NA}</Text>
              &nbsp;veOLAS. Grab your veOLAS by locking OLAS&nbsp;
              <Link href="/veolas">here</Link>. At least&nbsp;
              <Text strong>
                {minAcceptedETH ? ethers.formatEther(`${minAcceptedETH}`) : NA}
                &nbsp;ETH
              </Text>
              &nbsp;of donations is required to trigger boosts.
            </>
          }
          className="mb-16"
        />

        <DonateForm isLoading={isDonationLoading} onSubmit={onDepositServiceDonationSubmit} />
      </Card>

      <Card className="last-epoch-section">
        <Title level={2} className="mt-0">
          Epoch Status
        </Title>

        {epochStatusList.map(({ text, value }, index) => (
          <EpochStatus key={`epoch-section-${index}`}>
            <Title level={5}>{`${text}:`}</Title>
            {isDataLoading ? (
              <Skeleton.Input size="small" active />
            ) : (
              <Paragraph>{value}</Paragraph>
            )}
          </EpochStatus>
        ))}

        <EpochCheckpointRow>
          <Button
            size="large"
            type="primary"
            loading={isCheckpointLoading}
            disabled={!account || isDataLoading || isExpectedEndTimeInFuture}
            onClick={onCheckpoint}
          >
            Start new epoch
          </Button>
          <Text type="secondary">New epochs must be manually triggered by community members</Text>
          <ClaimStakingIncentives />
        </EpochCheckpointRow>
      </Card>
    </DonateContainer>
  );
};
