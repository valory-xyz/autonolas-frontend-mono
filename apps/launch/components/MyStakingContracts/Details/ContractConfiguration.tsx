import { Row, Skeleton, Typography } from 'antd';
import { FC, ReactNode, useMemo } from 'react';
import { Address } from 'viem';

import { GATEWAY_URL, NA } from '@autonolas/frontend-library';

import { EXPLORER_URLS, HASH_PREFIX, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { truncateAddress } from 'libs/util-functions/src';

import { CONTRACT_DEFAULT_VALUES } from 'common-util/constants/stakingContract';
import {
  useAgentInstances,
  useGetActivityChecker,
  useGetAgentIds,
  useGetConfigHash,
  useGetLivenessPeriod,
  useGetMaximumInactivityPeriods,
  useGetMinimumStakingDeposit,
  useGetMinimumStakingPeriods,
  useGetMultisigThreshold,
  useTimeForEmissions,
} from 'hooks/useGetStakingConstants';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

import {
  ActivityCheckerAddressLabel,
  AgentIdsLabel,
  AgentInstancesLabel,
  LivenessPeriodLabel,
  MaximumInactivityPeriodsLabel,
  MaximumStakedAgentsLabel,
  MinimumStakingDepositLabel,
  MinimumStakingPeriodsLabel,
  MultisigThresholdLabel,
  RewardsPerSecondLabel,
  ServiceConfigHashLabel,
  TimeForEmissionsLabel,
} from '../FormLabels';
import { ColFlexContainer } from './helpers';
import { useMaxNumServices, useRewardsPerSecond } from './hooks';

const { Text } = Typography;

const ShowContent = ({ isLoading, data }: { isLoading: boolean; data?: string | ReactNode }) => {
  const { networkId } = useAppSelector((state) => state.network);

  if (!networkId || isLoading) return <Skeleton.Input active size="small" />;
  return <Text>{data || NA}</Text>;
};

const ShowNetworkAddress = ({ address }: { address: Address }) => {
  const { networkId } = useAppSelector((state) => state.network);

  if (!networkId) return null;
  if (!address) return null;

  const truncatedAddress = truncateAddress(address);

  return (
    <a href={`${EXPLORER_URLS[networkId]}/address/${address}`} target="_blank" rel="noreferrer">
      {`${truncatedAddress} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
    </a>
  );
};

const MaximumStakedAgents: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useMaxNumServices({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const Rewards: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useRewardsPerSecond({ address });
  return <ShowContent isLoading={isLoading} data={`${data} OLAS` || NA} />;
};

const MinimumStakingDeposit: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetMinimumStakingDeposit({ address });
  console.log('MinimumStakingDeposit', data);
  return <ShowContent isLoading={isLoading} data={data} />;
};

const MinimumStakingPeriods: FC<{ address: Address }> = ({ address }) => {
  const { isLoading: isLivenessPeriodLoading, data: livenessPeriod } = useGetLivenessPeriod({
    address,
  });
  const { isLoading: isMinimumStakingPeriodsLoading, data: minimumStakingPeriods } =
    useGetMinimumStakingPeriods({ address });

  const isLoading = useMemo(
    () => isLivenessPeriodLoading || isMinimumStakingPeriodsLoading,
    [isLivenessPeriodLoading, isMinimumStakingPeriodsLoading],
  );
  const data = useMemo(() => {
    if (!livenessPeriod) return NA;
    if (!minimumStakingPeriods) return NA;

    const minStakingDuration = Number(minimumStakingPeriods) / Number(livenessPeriod);
    return `${minStakingDuration}`;
  }, [livenessPeriod, minimumStakingPeriods]);

  return <ShowContent isLoading={isLoading} data={data} />;
};

const MaximumInactivityPeriods: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetMaximumInactivityPeriods({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const LivenessPeriod: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetLivenessPeriod({ address });
  return <ShowContent isLoading={isLoading} data={data ? `${data} seconds` : NA} />;
};

const TimeForEmissions: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useTimeForEmissions({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const AgentInstances: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useAgentInstances({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const AgentIds: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetAgentIds({ address });
  return (
    <ShowContent isLoading={isLoading} data={!data || data?.length === 0 ? NA : data.join(', ')} />
  );
};

const MultisigThreshold: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetMultisigThreshold({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const ConfigHash: FC<{ address: Address }> = ({ address }) => {
  const { data: configHash, isLoading } = useGetConfigHash({ address });
  const isZeroAddress = configHash === CONTRACT_DEFAULT_VALUES.configHash;

  const getConfigHash = () => {
    if (!configHash) return NA;

    const truncateConfigHash = truncateAddress(configHash);
    if (isZeroAddress) return truncateConfigHash;

    const uri = `${HASH_PREFIX}${configHash.substring(2)}`;
    const ipfsUrl = `${GATEWAY_URL}${uri}`;
    return (
      <a href={ipfsUrl} target="_blank" rel="noreferrer">
        {truncateConfigHash} {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
    );
  };

  return <ShowContent isLoading={isLoading} data={getConfigHash()} />;
};

const ActivityCheckerAddress: FC<{ address: Address }> = ({ address }) => {
  const { data: checkerAddress, isLoading } = useGetActivityChecker({ address });
  return (
    <ShowContent
      isLoading={isLoading}
      data={<ShowNetworkAddress address={checkerAddress as Address} />}
    />
  );
};

/**
 * contract configuration details component for details page
 */
export const ContractConfiguration: FC<{ myStakingContract: MyStakingContract }> = ({
  myStakingContract,
}) => {
  return (
    <>
      <Row gutter={24}>
        <ColFlexContainer
          text={<MaximumStakedAgentsLabel />}
          content={<MaximumStakedAgents address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text={<RewardsPerSecondLabel />}
          content={<Rewards address={myStakingContract.id} />}
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<MinimumStakingDepositLabel />}
          content={<MinimumStakingDeposit address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text={<MinimumStakingPeriodsLabel />}
          content={<MinimumStakingPeriods address={myStakingContract.id} />}
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<MaximumInactivityPeriodsLabel />}
          content={<MaximumInactivityPeriods address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text={<LivenessPeriodLabel />}
          content={<LivenessPeriod address={myStakingContract.id} />}
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<TimeForEmissionsLabel />}
          content={<TimeForEmissions address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text={<AgentInstancesLabel />}
          content={<AgentInstances address={myStakingContract.id} />}
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<AgentIdsLabel />}
          content={<AgentIds address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text={<MultisigThresholdLabel />}
          content={<MultisigThreshold address={myStakingContract.id} />}
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<ServiceConfigHashLabel />}
          content={<ConfigHash address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text={<ActivityCheckerAddressLabel />}
          content={<ActivityCheckerAddress address={myStakingContract.id} />}
        />
      </Row>
    </>
  );
};
