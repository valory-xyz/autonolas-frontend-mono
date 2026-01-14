import { Typography } from 'antd';

import { LabelWithTooltip } from 'libs/ui-components/src';

import { FieldConfig } from './FieldConfig';

const { Text } = Typography;

export const NameLabel = () => <Text type="secondary">{FieldConfig.contractName.name}</Text>;

export const DescriptionLabel = () => <Text type="secondary">{FieldConfig.description.name}</Text>;

export const MaximumStakedAgentsLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.maxNumServices.name}
    description={FieldConfig.maxNumServices.desc}
  />
);

export const RewardsPerSecondLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.rewardsPerSecond.name}
    description={FieldConfig.rewardsPerSecond.desc}
  />
);

export const TemplateInfo = () => (
  <LabelWithTooltip text="Template" description="Template contracts must be approved by DAO vote" />
);

export const MinimumStakingDepositLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.minStakingDeposit.name}
    description={FieldConfig.minStakingDeposit.desc}
  />
);

export const MinimumStakingPeriodsLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.minNumStakingPeriods.name}
    description={FieldConfig.minNumStakingPeriods.desc}
  />
);

export const MaximumInactivityPeriodsLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.maxNumInactivityPeriods.name}
    description={FieldConfig.maxNumInactivityPeriods.desc}
  />
);

export const LivenessPeriodLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.livenessPeriod.name}
    description={FieldConfig.livenessPeriod.desc}
  />
);

export const TimeForEmissionsLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.timeForEmissions.name}
    description={FieldConfig.timeForEmissions.desc}
  />
);

export const AgentInstancesLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.numAgentInstances.name}
    description={FieldConfig.numAgentInstances.desc}
  />
);

export const AgentIdsLabel = () => (
  <LabelWithTooltip text={FieldConfig.agentIds.name} description={FieldConfig.agentIds.desc} />
);

export const MultisigThresholdLabel = () => (
  <LabelWithTooltip text={FieldConfig.threshold.name} description={FieldConfig.threshold.desc} />
);

export const ServiceConfigHashLabel = () => (
  <LabelWithTooltip text={FieldConfig.configHash.name} description={FieldConfig.configHash.desc} />
);

export const ProxyHashLabel = () => (
  <LabelWithTooltip text={FieldConfig.proxyHash.name} description={FieldConfig.proxyHash.desc} />
);

export const ActivityCheckerAddressLabel = () => (
  <LabelWithTooltip
    text={FieldConfig.activityChecker.name}
    description={FieldConfig.activityChecker.desc}
  />
);
