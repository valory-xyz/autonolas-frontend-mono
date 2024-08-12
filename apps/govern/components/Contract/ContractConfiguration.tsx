import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { ReactNode, useMemo } from 'react';
import { StakingContract } from 'types';
import { Address, zeroHash } from 'viem';

import { GATEWAY_URL, NA } from '@autonolas/frontend-library';

import { EXPLORER_URLS, HASH_PREFIX, REGISTRY_URL, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { truncateAddress } from 'libs/util-functions/src';

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
} from './FieldLabels';
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
} from './hooks';

const { Text } = Typography;

const ShowContent = ({
  isLoading,
  chainId,
  data,
}: {
  isLoading: boolean;
  chainId: number;
  data?: string | ReactNode;
}) => {
  if (!chainId || isLoading) return <Skeleton.Input active size="small" />;
  return <Text>{data || NA}</Text>;
};

type ConfigItemProps = {
  address: Address;
  chainId: number;
};

const ShowNetworkAddress = ({ address, chainId }: ConfigItemProps) => {
  if (!chainId) return null;
  if (!address) return null;

  const truncatedAddress = truncateAddress(address);
  return (
    <a href={`${EXPLORER_URLS[chainId]}/address/${address}`} target="_blank" rel="noreferrer">
      {`${truncatedAddress} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
    </a>
  );
};

const MaximumStakedAgents = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useMaxNumServices({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data} />;
};

const Rewards = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useRewardsPerSecond({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data || NA} />;
};

const MinimumStakingDeposit = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useGetMinimumStakingDeposit({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data} />;
};

const MinimumStakingPeriods = ({ address, chainId }: ConfigItemProps) => {
  const { isLoading: isLivenessPeriodLoading, data: livenessPeriod } = useGetLivenessPeriod({
    address,
    chainId,
  });
  const { isLoading: isMinimumStakingPeriodsLoading, data: minimumStakingDuration } =
    useGetMinimumStakingDuration({ address, chainId });

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

  return <ShowContent isLoading={isLoading} chainId={chainId} data={data} />;
};

const MaximumInactivityPeriods = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useGetMaximumInactivityPeriods({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data} />;
};

const LivenessPeriod = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useGetLivenessPeriod({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data || NA} />;
};

const TimeForEmissions = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useTimeForEmissions({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data} />;
};

const NumAgentInstances = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useNumberOfAgentInstances({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data} />;
};

const AgentIds = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useGetAgentIds({ address, chainId });
  const networkName = 'gnosis';

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

  return <ShowContent isLoading={isLoading} chainId={chainId} data={ids} />;
};

const MultisigThreshold = ({ address, chainId }: ConfigItemProps) => {
  const { data, isLoading } = useGetMultisigThreshold({ address, chainId });
  return <ShowContent isLoading={isLoading} chainId={chainId} data={data} />;
};

const ConfigHash = ({ address, chainId }: ConfigItemProps) => {
  const { data: configHash, isLoading } = useGetConfigHash({ address, chainId });
  const isZeroAddress = configHash === zeroHash;

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

  return <ShowContent isLoading={isLoading} chainId={chainId} data={calculatedConfigHash} />;
};

const ActivityCheckerAddress = ({ address, chainId }: ConfigItemProps) => {
  const { data: checkerAddress, isLoading } = useGetActivityChecker({ address, chainId });
  return (
    <ShowContent
      isLoading={isLoading}
      chainId={chainId}
      data={<ShowNetworkAddress chainId={chainId} address={checkerAddress as Address} />}
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
export const ContractConfiguration = ({ contract }: { contract: StakingContract }) => {
  return (
    <>
      <Row gutter={24}>
        <ColFlexContainer
          text={<MaximumStakedAgentsLabel />}
          content={<MaximumStakedAgents chainId={contract.chainId} address={contract.address} />}
          data-testid="maximum-staked-agents"
        />
        <ColFlexContainer
          text={<RewardsPerSecondLabel />}
          content={<Rewards chainId={contract.chainId} address={contract.address} />}
          data-testid="rewards-per-second"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<MinimumStakingDepositLabel />}
          content={<MinimumStakingDeposit chainId={contract.chainId} address={contract.address} />}
          data-testid="minimum-staking-deposit"
        />
        <ColFlexContainer
          text={<MinimumStakingPeriodsLabel />}
          content={<MinimumStakingPeriods chainId={contract.chainId} address={contract.address} />}
          data-testid="minimum-staking-periods"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<MaximumInactivityPeriodsLabel />}
          content={
            <MaximumInactivityPeriods chainId={contract.chainId} address={contract.address} />
          }
          data-testid="maximum-inactivity-periods"
        />
        <ColFlexContainer
          text={<LivenessPeriodLabel />}
          content={<LivenessPeriod chainId={contract.chainId} address={contract.address} />}
          data-testid="liveness-period"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<TimeForEmissionsLabel />}
          content={<TimeForEmissions chainId={contract.chainId} address={contract.address} />}
          data-testid="time-for-emissions"
        />
        <ColFlexContainer
          text={<AgentInstancesLabel />}
          content={<NumAgentInstances chainId={contract.chainId} address={contract.address} />}
          data-testid="num-agent-instances"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<AgentIdsLabel />}
          content={<AgentIds chainId={contract.chainId} address={contract.address} />}
          data-testid="agent-ids"
        />
        <ColFlexContainer
          text={<MultisigThresholdLabel />}
          content={<MultisigThreshold chainId={contract.chainId} address={contract.address} />}
          data-testid="multisig-threshold"
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<ServiceConfigHashLabel />}
          content={<ConfigHash chainId={contract.chainId} address={contract.address} />}
          data-testid="service-config-hash"
        />
        <ColFlexContainer
          text={<ActivityCheckerAddressLabel />}
          content={<ActivityCheckerAddress chainId={contract.chainId} address={contract.address} />}
          data-testid="activity-checker-address"
        />
      </Row>
    </>
  );
};
