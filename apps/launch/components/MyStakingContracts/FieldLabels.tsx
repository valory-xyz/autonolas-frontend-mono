import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';

import { COLOR } from 'libs/ui-theme/src';

import { FieldConfig } from './FieldConfig';

const { Paragraph, Text } = Typography;

const TextWithTooltip = ({
  text,
  description,
}: {
  text: string;
  description?: string | ReactNode;
}) => {
  if (!description) return <Text type="secondary">{text}</Text>;

  return (
    <Tooltip color={COLOR.WHITE} title={<Paragraph className="m-0">{description}</Paragraph>}>
      <Text type="secondary">
        {text} <InfoCircleOutlined className="ml-4" />
      </Text>
    </Tooltip>
  );
};

export const NameLabel = () => <TextWithTooltip text={FieldConfig.contractName.name} />;

export const DescriptionLabel = () => <TextWithTooltip text={FieldConfig.description.name} />;

export const MaximumStakedAgentsLabel = () => (
  <TextWithTooltip
    text={FieldConfig.maxNumServices.name}
    description={FieldConfig.maxNumServices.desc}
  />
);

export const RewardsPerSecondLabel = () => (
  <TextWithTooltip
    text={FieldConfig.rewardsPerSecond.name}
    description={FieldConfig.rewardsPerSecond.desc}
  />
);

export const TemplateInfo = () => (
  <TextWithTooltip text="Template" description="Template contracts must be approved by DAO vote" />
);

export const MinimumStakingDepositLabel = () => (
  <TextWithTooltip
    text={FieldConfig.minStakingDeposit.name}
    description={FieldConfig.minStakingDeposit.desc}
  />
);

export const MinimumStakingPeriodsLabel = () => (
  <TextWithTooltip
    text={FieldConfig.minNumStakingPeriods.name}
    description={FieldConfig.minNumStakingPeriods.desc}
  />
);

export const MaximumInactivityPeriodsLabel = () => (
  <TextWithTooltip
    text={FieldConfig.maxNumInactivityPeriods.name}
    description={FieldConfig.maxNumInactivityPeriods.desc}
  />
);

export const LivenessPeriodLabel = () => (
  <TextWithTooltip
    text={FieldConfig.livenessPeriod.name}
    description={FieldConfig.livenessPeriod.desc}
  />
);

export const TimeForEmissionsLabel = () => (
  <TextWithTooltip
    text={FieldConfig.timeForEmissions.name}
    description={FieldConfig.timeForEmissions.desc}
  />
);

export const AgentInstancesLabel = () => (
  <TextWithTooltip
    text={FieldConfig.numAgentInstances.name}
    description={FieldConfig.numAgentInstances.desc}
  />
);

export const AgentIdsLabel = () => (
  <TextWithTooltip text={FieldConfig.agentIds.name} description={FieldConfig.agentIds.desc} />
);

export const MultisigThresholdLabel = () => (
  <TextWithTooltip text={FieldConfig.threshold.name} description={FieldConfig.threshold.desc} />
);

export const ServiceConfigHashLabel = () => (
  <TextWithTooltip text={FieldConfig.configHash.name} description={FieldConfig.configHash.desc} />
);

export const ActivityCheckerAddressLabel = () => (
  <TextWithTooltip
    text={FieldConfig.activityChecker.name}
    description={FieldConfig.activityChecker.desc}
  />
);
