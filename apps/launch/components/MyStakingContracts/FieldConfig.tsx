import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { Rule } from 'antd/es/form';
import { ReactNode } from 'react';

import { COLOR } from 'libs/ui-theme/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { FORM_VALIDATION } from 'libs/util-functions/src';

import {
  useMinStakingDepositLimit,
  useNumServicesLimit,
  useTimeForEmissionsLimit,
} from 'hooks/useStakingVerifier';

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
 * function to get generic field rules
 */
const getGenericFieldRules = (label: string) => [
  { required: true, message: `Please enter ${label}` },
];

/**
 * List of FieldConfig for form fields
 */
const FieldConfig: Record<keyof FormValues, { name: string; desc?: string | ReactNode }> = {
  contractName: { name: 'Name', desc: null },
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
  },
  minStakingDeposit: {
    name: 'Minimum service staking deposit, OLAS',
    desc: (
      <Flex gap={8} vertical>
        <span>
          The established value of minimal non-slashable security deposit and minimal slashable
          operator bonds required for staking.
        </span>

        <span>
          Operators need to stake:
          <Text strong>this × the number of agent instances + 1.</Text>
        </span>
      </Flex>
    ),
  },
  minNumStakingPeriods: {
    name: 'Minimum number of staking periods',
    desc: 'Minimum number of staking periods before the service can be unstaked',
  },
  maxNumInactivityPeriods: {
    name: 'Maximum number of inactivity periods',
    desc: 'Maximum duration of inactivity permitted for the agent before facing eviction.',
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
  },
  numAgentInstances: {
    name: 'Number of agent instances',
    desc: 'Quantity of agent instances associated with an autonomous service registered in the staking contract.',
  },
  agentIds: {
    name: 'Agent IDs',
    desc: 'If set, serves as a requirement for a service to be comprised of agent Ids specified.',
  },
  threshold: {
    name: 'Multisig threshold',
    desc: 'Service multisig threshold requirement. 0 - no threshold is enforced',
  },
  configHash: {
    name: 'Service configuration hash',
    desc: 'Service configuration hash requirement',
  },
  activityChecker: {
    name: 'Activity checker address',
    desc: 'Activity checker handles the logic to monitor whether a specific service activity has been performed.',
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

/** ******* RULES ******* */
type StakingDepositRules = { [K in keyof FormValues]: { rules: Rule[] | undefined } };
export const useCreateStakingContractRules = (): StakingDepositRules => {
  const { data: numServicesLimit } = useNumServicesLimit();
  const { data: minStakingDepositLimit } = useMinStakingDepositLimit();
  const { data: timeForEmissionsLimit } = useTimeForEmissionsLimit();

  return {
    contractName: { rules: getGenericFieldRules(FieldConfig.contractName.name) },
    description: { rules: getGenericFieldRules(FieldConfig.description.name) },
    maxNumServices: {
      rules: [
        ...getGenericFieldRules(FieldConfig.maxNumServices.name),
        {
          type: 'number',
          min: 1,
          max: numServicesLimit,
          message: `Maximum number of staked agents must be at least 1 and at most ${numServicesLimit}`,
        },
      ],
    },
    rewardsPerSecond: { rules: getGenericFieldRules(FieldConfig.rewardsPerSecond.name) },
    minStakingDeposit: {
      rules: [
        ...getGenericFieldRules(FieldConfig.minStakingDeposit.name),
        {
          type: 'number',
          min: 1,
          max: minStakingDepositLimit,
          message: `Minimum service staking deposit, OLAS must be at least 1 and at most ${minStakingDepositLimit}`,
        },
      ],
    },
    minNumStakingPeriods: { rules: getGenericFieldRules(FieldConfig.minNumStakingPeriods.name) },
    maxNumInactivityPeriods: {
      rules: getGenericFieldRules(FieldConfig.maxNumInactivityPeriods.name),
    },
    livenessPeriod: {
      rules: [
        ...getGenericFieldRules(FieldConfig.livenessPeriod.name),
        {
          type: 'number',
          min: 86400,
          max: 86400 * 30,
          message: `Liveness period must be between 24 hours and 30 days`,
        },
      ],
    },
    timeForEmissions: {
      rules: [
        {
          required: true,
          message: `Please enter Time for emissions`,
        },
        {
          type: 'number',
          min: 1,
          max: timeForEmissionsLimit,
          message: `Time for emissions must be between 1 and ${timeForEmissionsLimit} seconds`,
        },
      ],
    },
    numAgentInstances: { rules: getGenericFieldRules(FieldConfig.numAgentInstances.name) },
    agentIds: {
      rules: [{ ...FORM_VALIDATION.validateCommaSeparatedList }],
    },
    threshold: { rules: undefined },
    configHash: { rules: undefined },
    activityChecker: {
      rules: [
        ...getGenericFieldRules(FieldConfig.activityChecker.name),
        { ...FORM_VALIDATION.validateAddress },
      ],
    },
  };
};
