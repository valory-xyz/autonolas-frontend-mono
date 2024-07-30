import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';

import { COLOR } from 'libs/ui-theme/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

const { Paragraph, Text } = Typography;

export type FormValues = {
  name: string;
  description: string;
  maxNumServices: number;
  rewardsPerSecond: number;
  minStakingDeposit: number;
  minNumStakingPeriods: number;
  maxNumInactivityPeriods: number;
  livenessPeriod: number;
  timeForEmissions: number;
  numAgentInstances: number;
  agentIds: string;
  threshold: number;
  configHash: string;
  activityChecker: string;
};

/**
 * function to get field rules
 * @param label
 * @returns
 */
export const getFieldRules = (label: string) => [
  { required: true, message: `Please enter ${label}` },
];

export const LABELS = {
  contractName: { name: 'Name', desc: null, rules: [] },
  description: { name: 'Description', desc: null },
  maxNumServices: {
    name: 'Maximum number of staked agents',
    desc: (
      <>
        How many agents do you need running? Agents can be sovereign or decentralized agents. They
        join the contract on a first come, first serve basis.
        <br />
        <a href="https://olas.network/learn" target="_blank">
          Learn more {UNICODE_SYMBOLS.EXTERNAL_LINK}
        </a>
      </>
    ),
  },
  rewardsPerSecond: {
    name: 'Rewards, OLAS per second',
    desc: 'Token rewards come from the Olas protocol',
    rules: getFieldRules('Rewards, OLAS per second'),
  },
  minStakingDeposit: {
    name: 'Minimum service staking deposit, OLAS',
    desc: 'Minimum amount of OLAS that operators need to stake to participate in the staking program',
    rules: getFieldRules('Minimum service staking deposit, OLAS'),
  },
  minNumStakingPeriods: {
    name: 'Minimum number of staking periods',
    desc: null, // TODO
    rules: getFieldRules('Minimum number of staking periods'),
  },
  maxNumInactivityPeriods: {
    name: 'Maximum number of inactivity periods',
    desc: null, // TODO
    rules: getFieldRules('Maximum number of inactivity periods'),
  },
  livenessPeriod: {
    name: 'Liveness period',
    desc: null, // TODO
    rules: getFieldRules('Liveness period'),
  },
  timeForEmissions: {
    name: 'Time for emissions',
    desc: null, // TODO
    rules: getFieldRules('Time for emissions'),
  },
  numAgentInstances: {
    name: 'Number of agent instances',
    desc: null, // TODO
    rules: getFieldRules('Number of agent instances'),
  },
  agentIds: { name: 'Agent Ids', desc: null, rules: null },
  threshold: { name: 'Multisig threshold', desc: null, rules: null },
  configHash: { name: 'Service configuration hash', desc: null, rules: null },
  activityChecker: {
    name: 'Activity checker address',
    desc: null,
    rules: getFieldRules('Activity checker address'),
  },
} as const;

const TextWithTooltip = ({
  text,
  description,
}: {
  text: string;
  description?: string | React.ReactNode;
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

export const NameLabel = () => <TextWithTooltip text={LABELS.contractName.name} />;

export const DescriptionLabel = () => <TextWithTooltip text={LABELS.description.name} />;

export const MaxNumServicesLabel = () => (
  <TextWithTooltip text={LABELS.maxNumServices.name} description={LABELS.maxNumServices.desc} />
);

export const RewardsPerSecondLabel = () => (
  <TextWithTooltip text={LABELS.rewardsPerSecond.name} description={LABELS.rewardsPerSecond.desc} />
);

export const TemplateInfo = () => (
  <TextWithTooltip text="Template" description="Template contracts must be approved by DAO vote" />
);

export const MinimumStakingDepositLabel = () => (
  <TextWithTooltip
    text={LABELS.minStakingDeposit.name}
    description="Minimum amount of OLAS that operators need to stake to participate in the staking program"
  />
);

export const MinNumStakingPeriodsLabel = () => (
  <TextWithTooltip
    text={LABELS.minNumStakingPeriods.name}
    description={LABELS.minNumStakingPeriods.desc}
  />
);

export const MaxNumInactivityPeriodsLabel = () => (
  <TextWithTooltip
    text={LABELS.maxNumInactivityPeriods.name}
    description={LABELS.maxNumInactivityPeriods.desc}
  />
);

export const LivenessPeriodLabel = () => (
  <TextWithTooltip text={LABELS.livenessPeriod.name} description={LABELS.livenessPeriod.desc} />
);

export const TimeForEmissionsLabel = () => (
  <TextWithTooltip text={LABELS.timeForEmissions.name} description={LABELS.timeForEmissions.desc} />
);

export const NumAgentInstancesLabel = () => (
  <TextWithTooltip
    text={LABELS.numAgentInstances.name}
    description={LABELS.numAgentInstances.desc}
  />
);

export const AgentIdsLabel = () => (
  <TextWithTooltip text={LABELS.agentIds.name} description={LABELS.agentIds.desc} />
);

export const ThresholdLabel = () => (
  <TextWithTooltip text={LABELS.threshold.name} description={LABELS.threshold.desc} />
);

export const ConfigHashLabel = () => (
  <TextWithTooltip text={LABELS.configHash.name} description={LABELS.configHash.desc} />
);

export const ActivityCheckerLabel = () => (
  <TextWithTooltip text={LABELS.activityChecker.name} description={LABELS.activityChecker.desc} />
);

// type FormNames = keyof FormValues;
// export const Rules: Record<FormNames, ReturnType<typeof getFieldRules>> = {
//   name: getFieldRules(LABELS.contractName.name),
//   description: getFieldRules(LABELS.description.name),
//   maxNumServices: getFieldRules(LABELS.maxNumServices.name),
//   rewardsPerSecond: getFieldRules(LABELS.rewardsPerSecond.name),
//   minStakingDeposit: getFieldRules(LABELS.minStakingDeposit.name),
//   minNumStakingPeriods: getFieldRules(LABELS.minNumStakingPeriods),
//   maxNumInactivityPeriods: getFieldRules(LABELS.maxNumInactivityPeriods),
//   livenessPeriod: getFieldRules(LABELS.livenessPeriod),
//   timeForEmissions: getFieldRules(LABELS.timeForEmissions),
//   numAgentInstances: getFieldRules(LABELS.numAgentInstances),
//   agentIds: getFieldRules(LABELS.agentIds),
//   threshold: getFieldRules(LABELS.threshold),
//   configHash: getFieldRules(LABELS.configHash),
//   activityChecker: getFieldRules(LABELS.activityChecker),
// };
