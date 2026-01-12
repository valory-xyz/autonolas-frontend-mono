import { Button, Card, Skeleton, Typography } from 'antd';
import isNumber from 'lodash/isNumber';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { NA } from 'libs/util-constants/src';
import { getFullFormattedDate } from 'common-util/functions/time';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { checkpointRequest } from 'common-util/functions';

import { useThresholdData } from '../Donate/hooks';
import { ClaimStakingIncentives } from '../Donate/ClaimStakingIncentives';
import { EpochCheckpointRow, EpochStatus } from './styles';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 946px;
  margin: 0 auto;
`;

export const EpochPage = () => {
  const { address: account } = useAccount();
  const [isCheckpointLoading, setIsCheckpointLoading] = useState(false);

  const {
    isDataLoading,
    refetchData,
    epochCounter,
    prevEpochEndTime,
    epochLength,
    nextEpochEndTime,
  } = useThresholdData();

  const onCheckpoint = async () => {
    if (!account) return;

    try {
      setIsCheckpointLoading(true);
      await checkpointRequest({ account });
      await refetchData();
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

  const isExpectedEndTimeInFuture = (nextEpochEndTime || 0) * 1000 > Date.now();

  return (
    <StyledMain>
      <Card>
        <Title level={3} className="mt-0">
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
    </StyledMain>
  );
};
