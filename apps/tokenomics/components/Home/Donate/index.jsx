import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Alert, Button, Typography } from 'antd';
import { isNumber } from 'lodash';
import {
  getFullFormattedDate,
  notifySuccess,
  NA,
} from '@autonolas/frontend-library';

import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import {
  parseToEth,
  parseToWei,
  sortUnitIdsAndTypes,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  getEpochCounter,
  getLastEpochRequest,
} from '../DevIncentives/requests';
import {
  checkServicesNotTerminatedOrNotDeployed,
  checkpointRequest,
  depositServiceDonationRequest,
  getVeOlasThresholdRequest,
  minAcceptedEthRequest,
} from './requests';
import { DonateContainer, EpochStatus, EpochCheckpointRow } from './styles';

const { Title, Paragraph, Text } = Typography;

export const DepositServiceDonation = () => {
  const { account, chainId } = useHelpers();

  // epoch details
  const [isEpochDetailsLoading, setIsEpochDetailsLoading] = useState(true);
  const [threshold, setThreshold] = useState(0);
  const [minAcceptedEth, setMinAcceptedEth] = useState(0);
  const [epochCounter, setEpochCounter] = useState(null);
  const [epochDetails, setEpochDetails] = useState(null);

  // donation
  const [isDonationLoading, setIsDonationLoading] = useState(false);

  // checkpoint
  const [isCheckpointLoading, setIsCheckpointLoading] = useState(false);

  const getThresholdData = async () => {
    try {
      setIsEpochDetailsLoading(true);

      const response = await getVeOlasThresholdRequest();
      setThreshold(response);

      const minEth = await minAcceptedEthRequest();
      setMinAcceptedEth(minEth);

      const epochResponse = await getLastEpochRequest();
      setEpochDetails(epochResponse);

      const epochCtr = await getEpochCounter();
      setEpochCounter(epochCtr);
    } catch (error) {
      window.console.error(error);
    } finally {
      setIsEpochDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (chainId) {
      getThresholdData();
    }
  }, [chainId]);

  const onDepositServiceDonationSubmit = async (values) => {
    try {
      setIsDonationLoading(true);

      const [sortedUnitIds, sortedUnitTypes] = sortUnitIdsAndTypes(
        values.unitIds,
        values.unitTypes,
      );

      const serviceIds = sortedUnitIds.map((e) => `${e}`);
      const amounts = sortedUnitTypes.map((e) => parseToWei(e));
      const totalAmount = amounts
        .reduce(
          (a, b) => ethers.BigNumber.from(a).add(ethers.BigNumber.from(b)),
          ethers.BigNumber.from(0),
        )
        .toString();
      const params = {
        account,
        serviceIds,
        amounts,
        totalAmount,
      };

      const invalidServices = await checkServicesNotTerminatedOrNotDeployed(
        serviceIds,
      );

      // deposit only if all services are deployed or terminated
      if (invalidServices.length === 0) {
        await depositServiceDonationRequest(params);
        notifySuccess('Deposited service donation successfully');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDonationLoading(false);
    }
  };

  const epochStatusList = [
    {
      text: 'Earliest possible expected end time',
      value: epochDetails?.nextEpochEndTime
        ? getFullFormattedDate(epochDetails.nextEpochEndTime * 1000)
        : NA,
    },
    {
      text: 'Epoch length',
      value: isNumber(epochDetails?.epochLen)
        ? `${epochDetails.epochLen / 3600 / 24} days`
        : NA,
    },
    {
      text: 'Previous epoch end time',
      value: epochDetails?.prevEpochEndTime
        ? getFullFormattedDate(epochDetails.prevEpochEndTime * 1000)
        : NA,
    },
    {
      text: 'Epoch counter',
      value: epochCounter || NA,
    },
  ];

  const onCheckpoint = async () => {
    try {
      setIsCheckpointLoading(true);
      await checkpointRequest(account);

      await getThresholdData(); // update epoch details after checkpoint
      notifySuccess('Started new epoch');
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckpointLoading(false);
    }
  };

  // disable checkpoint button if expected end time is in the future
  const isExpectedEndTimeInFuture = (epochDetails?.nextEpochEndTime || 0) * 1000 > Date.now();

  return (
    <DonateContainer>
      <div className="donate-section">
        <Title level={2}>Donate</Title>
        <Paragraph>
          Show appreciation for the value of an autonomous service by making a
          donation. The protocol will reward devs who have contributed code for
          that service.
        </Paragraph>

        <Alert
          showIcon
          type="info"
          message={(
            <>
              To boost rewards of devs with freshly minted OLAS, you must hold
              at least&nbsp;
              <Text strong>{threshold || NA}</Text>
              &nbsp;veOLAS. Grab your veOLAS by locking OLAS&nbsp;
              <a href="https://member.olas.network/" target="_self">
                here
              </a>
              . At least&nbsp;
              <Text strong>
                {minAcceptedEth ? parseToEth(minAcceptedEth) : NA}
                &nbsp;ETH
              </Text>
              &nbsp;of donations is required to trigger boosts.
            </>
          )}
          className="mb-16"
        />

        <DynamicFieldsForm
          isLoading={isDonationLoading}
          isUnitTypeInput={false}
          inputOneLabel="Service ID"
          inputTwoLabel="Amount (ETH)"
          buttonText="Add row"
          submitButtonText="Donate"
          onSubmit={onDepositServiceDonationSubmit}
          canResetOnSubmit
        />
      </div>

      <div className="last-epoch-section">
        <Title level={2}>Epoch Status</Title>

        {epochStatusList.map((e, index) => (
          <EpochStatus key={`epoch-section-${index}`}>
            <Title level={5}>{`${e.text}:`}</Title>
            <Paragraph>{e.value}</Paragraph>
          </EpochStatus>
        ))}

        <EpochCheckpointRow>
          <Button
            type="primary"
            loading={isCheckpointLoading}
            disabled={isEpochDetailsLoading || isExpectedEndTimeInFuture}
            onClick={onCheckpoint}
          >
            Start new epoch
          </Button>
          <Text type="secondary">
            New epochs must be manually triggered by community members
          </Text>
        </EpochCheckpointRow>
      </div>
    </DonateContainer>
  );
};
