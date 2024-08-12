import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { FC, ReactNode, useMemo } from 'react';
import { Address } from 'viem';

import { GATEWAY_URL, NA } from '@autonolas/frontend-library';

import { EXPLORER_URLS, HASH_PREFIX, REGISTRY_URL, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { truncateAddress } from 'libs/util-functions/src';

import { CONTRACT_DEFAULT_VALUES } from 'common-util/constants/stakingContract';
import {
  useGetActivityChecker,
  useGetAgentIds,
  useGetConfigHash,
  useGetLivenessPeriod,
  useGetMaximumInactivityPeriods,
  useGetMinimumStakingDeposit,
  useGetMinimumStakingDuration,
  useGetMultisigThreshold,
  useMaxNumServices,
  useNumberOfAgentInstances,
  useRewardsPerSecond,
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
} from '../FieldLabels';

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
  return <ShowContent isLoading={isLoading} data={data || NA} />;
};

const MinimumStakingDeposit: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetMinimumStakingDeposit({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const MinimumStakingPeriods: FC<{ address: Address }> = ({ address }) => {
  const { isLoading: isLivenessPeriodLoading, data: livenessPeriod } = useGetLivenessPeriod({
    address,
  });
  const { isLoading: isMinimumStakingPeriodsLoading, data: minimumStakingDuration } =
    useGetMinimumStakingDuration({ address });

  const isLoading = useMemo(
    () => isLivenessPeriodLoading || isMinimumStakingPeriodsLoading,
    [isLivenessPeriodLoading, isMinimumStakingPeriodsLoading],
  );
  const data = useMemo(() => {
    if (!livenessPeriod) return NA;
    if (!minimumStakingDuration) return NA;

    const minimumStakingPeriods = Number(minimumStakingDuration) / Number(livenessPeriod);
    return minimumStakingPeriods;
  }, [livenessPeriod, minimumStakingDuration]);

  return <ShowContent isLoading={isLoading} data={data} />;
};

const MaximumInactivityPeriods: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetMaximumInactivityPeriods({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const LivenessPeriod: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetLivenessPeriod({ address });
  return <ShowContent isLoading={isLoading} data={data || NA} />;
};

const TimeForEmissions: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useTimeForEmissions({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const NumAgentInstances: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useNumberOfAgentInstances({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const AgentIds: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetAgentIds({ address });
  const { networkName } = useAppSelector((state) => state.network);

  const ids = useMemo(() => {
    if (!data || data.length === 0) return NA;
    return data.map((id) => (
      <a
        key={id}
        href={`${REGISTRY_URL}${networkName}/services/${id}`}
        target="_blank"
        rel="noreferrer"
      >
        {id}
      </a>
    ));
  }, [data, networkName]);

  return <ShowContent isLoading={isLoading} data={ids} />;
};

const MultisigThreshold: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetMultisigThreshold({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const ConfigHash: FC<{ address: Address }> = ({ address }) => {
  const { data: configHash, isLoading } = useGetConfigHash({ address });
  const isZeroAddress = configHash === CONTRACT_DEFAULT_VALUES.configHash;

  const calculatedConfigHash = useMemo(() => {
    if (!configHash) return NA;

    const truncateConfigHash = truncateAddress(configHash);

    // if configHash is zero address, no need to show external link
    if (isZeroAddress) return truncateConfigHash;

    const uri = `${HASH_PREFIX}${configHash.substring(2)}`;
    const ipfsUrl = `${GATEWAY_URL}${uri}`;
    return (
      <a href={ipfsUrl} target="_blank" rel="noreferrer">
        {truncateConfigHash} {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
    );
  }, [configHash, isZeroAddress]);

  return <ShowContent isLoading={isLoading} data={calculatedConfigHash} />;
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

type ColFlexContainerProps = { text: string | ReactNode; content: ReactNode };

export const ColFlexContainer = ({ text, content, ...rest }: ColFlexContainerProps) => {
  return (
    <Col span={12} {...rest}>
      <Flex vertical gap={4} align="flex-start">
        {typeof text === 'string' ? <Text type="secondary">{text}</Text> : text}
        {content}
      </Flex>
    </Col>
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
          data-testid="maximum-staked-agents"
        />
        <ColFlexContainer
          text={<RewardsPerSecondLabel />}
          content={<Rewards address={myStakingContract.id} />}
          data-testid="rewards-per-second"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<MinimumStakingDepositLabel />}
          content={<MinimumStakingDeposit address={myStakingContract.id} />}
          data-testid="minimum-staking-deposit"
        />
        <ColFlexContainer
          text={<MinimumStakingPeriodsLabel />}
          content={<MinimumStakingPeriods address={myStakingContract.id} />}
          data-testid="minimum-staking-periods"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<MaximumInactivityPeriodsLabel />}
          content={<MaximumInactivityPeriods address={myStakingContract.id} />}
          data-testid="maximum-inactivity-periods"
        />
        <ColFlexContainer
          text={<LivenessPeriodLabel />}
          content={<LivenessPeriod address={myStakingContract.id} />}
          data-testid="liveness-period"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<TimeForEmissionsLabel />}
          content={<TimeForEmissions address={myStakingContract.id} />}
          data-testid="time-for-emissions"
        />
        <ColFlexContainer
          text={<AgentInstancesLabel />}
          content={<NumAgentInstances address={myStakingContract.id} />}
          data-testid="num-agent-instances"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<AgentIdsLabel />}
          content={<AgentIds address={myStakingContract.id} />}
          data-testid="agent-ids"
        />
        <ColFlexContainer
          text={<MultisigThresholdLabel />}
          content={<MultisigThreshold address={myStakingContract.id} />}
          data-testid="multisig-threshold"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<ServiceConfigHashLabel />}
          content={<ConfigHash address={myStakingContract.id} />}
          data-testid="service-config-hash"
        />
        <ColFlexContainer
          text={<ActivityCheckerAddressLabel />}
          content={<ActivityCheckerAddress address={myStakingContract.id} />}
          data-testid="activity-checker-address"
        />
      </Row>
    </>
  );
};
