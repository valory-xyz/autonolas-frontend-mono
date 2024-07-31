import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { Rule } from 'antd/es/form';
import { ReactNode } from 'react';

import { COLOR } from 'libs/ui-theme/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

const { Paragraph, Text } = Typography;

export type FormValues = {
  contractName: string;
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
export const getGenericFieldRules = (label: string) => [
  { required: true, message: `Please enter ${label}` },
];

export const LABELS: Record<
  keyof FormValues,
  { name: string; desc?: string | ReactNode; rules?: Rule[] | undefined }
> = {
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
    desc: null, // TODO
    rules: getGenericFieldRules('Rewards, OLAS per second'),
  },
  minStakingDeposit: {
    name: 'Minimum service staking deposit, OLAS',
    desc: (
      <Flex gap={8} vertical>
        <span>
          The established value of minimal non-slashable security deposit and minimal slashable
          operator bonds required for staking.
        </span>

        <span> Operators need to stake:this × the number of agent instances + 1.</span>
      </Flex>
    ),
    rules: getGenericFieldRules('Minimum service staking deposit, OLAS'),
  },
  minNumStakingPeriods: {
    name: 'Minimum number of staking periods',
    desc: 'Minimum number of staking periods before the service can be unstaked',
    rules: getGenericFieldRules('Minimum number of staking periods'),
  },
  maxNumInactivityPeriods: {
    name: 'Maximum number of inactivity periods',
    desc: 'Maximum duration of inactivity permitted for the agent before facing eviction.',
    rules: getGenericFieldRules('Maximum number of inactivity periods'),
  },
  livenessPeriod: {
    name: 'Liveness period',
    desc: (
      <Flex gap={8} vertical>
        <span>
          Time frame in seconds during which the staking contract assesses the activity of the
          service.
        </span>

        <span>24 hours - 86400 seconds</span>
      </Flex>
    ),
    rules: getGenericFieldRules('Liveness period'),
  },
  timeForEmissions: {
    name: 'Time for emissions',
    desc: (
      <Flex gap={8} vertical>
        <span>
          Time for which staking emissions are requested in order to feed a staking contract
          considering that all the service slots are filled and all services are active.
        </span>

        <span>30 days - 2592000 seconds</span>
      </Flex>
    ),
    rules: getGenericFieldRules('Time for emissions'),
  },
  numAgentInstances: {
    name: 'Number of agent instances',
    desc: 'Quantity of agent instances associated with an autonomous service registered in the staking contract.',
    rules: getGenericFieldRules('Number of agent instances'),
  },
  agentIds: {
    name: 'Agent IDs',
    desc: 'If set, serves as a requirement for a service to be comprised of agent Ids specified.',
    rules: undefined,
  },
  threshold: {
    name: 'Multisig threshold',
    desc: 'Service multisig threshold requirement. 0 - no threshold is enforced',
    rules: undefined,
  },
  configHash: {
    name: 'Service configuration hash',
    desc: 'Service configuration hash requirement',
    rules: undefined,
  },
  activityChecker: {
    name: 'Activity checker address',
    desc: 'Activity checker handles the logic to monitor whether a specific service activity has been performed.',
    rules: getGenericFieldRules('Activity checker address'),
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

export const MaximumStakedAgentsLabel = () => (
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
    description={LABELS.minStakingDeposit.desc}
  />
);

export const MinimumStakingPeriodsLabel = () => (
  <TextWithTooltip
    text={LABELS.minNumStakingPeriods.name}
    description={LABELS.minNumStakingPeriods.desc}
  />
);

export const MaximumInactivityPeriodsLabel = () => (
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

export const AgentInstancesLabel = () => (
  <TextWithTooltip
    text={LABELS.numAgentInstances.name}
    description={LABELS.numAgentInstances.desc}
  />
);

export const AgentIdsLabel = () => (
  <TextWithTooltip text={LABELS.agentIds.name} description={LABELS.agentIds.desc} />
);

export const MultisigThresholdLabel = () => (
  <TextWithTooltip text={LABELS.threshold.name} description={LABELS.threshold.desc} />
);

export const ServiceConfigHashLabel = () => (
  <TextWithTooltip text={LABELS.configHash.name} description={LABELS.configHash.desc} />
);

export const ActivityCheckerAddressLabel = () => (
  <TextWithTooltip text={LABELS.activityChecker.name} description={LABELS.activityChecker.desc} />
);

// type FormNames = keyof FormValues;
// export const Rules: Record<FormNames, ReturnType<typeof getGenericFieldRules>> = {
//   name: getGenericFieldRules(LABELS.contractName.name),
//   description: getGenericFieldRules(LABELS.description.name),
//   maxNumServices: getGenericFieldRules(LABELS.maxNumServices.name),
//   rewardsPerSecond: getGenericFieldRules(LABELS.rewardsPerSecond.name),
//   minStakingDeposit: getGenericFieldRules(LABELS.minStakingDeposit.name),
//   minNumStakingPeriods: getGenericFieldRules(LABELS.minNumStakingPeriods),
//   maxNumInactivityPeriods: getGenericFieldRules(LABELS.maxNumInactivityPeriods),
//   livenessPeriod: getGenericFieldRules(LABELS.livenessPeriod),
//   timeForEmissions: getGenericFieldRules(LABELS.timeForEmissions),
//   numAgentInstances: getGenericFieldRules(LABELS.numAgentInstances),
//   agentIds: getGenericFieldRules(LABELS.agentIds),
//   threshold: getGenericFieldRules(LABELS.threshold),
//   configHash: getGenericFieldRules(LABELS.configHash),
//   activityChecker: getGenericFieldRules(LABELS.activityChecker),
// };
