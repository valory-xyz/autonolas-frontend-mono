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

export const LABELS = {
  name: 'Name',
  description: 'Description',
  maxNumServices: 'Maximum number of staked agents',
  rewardsPerSecond: 'Rewards, OLAS per second',
  minStakingDeposit: 'Minimum service staking deposit, OLAS',
  minNumStakingPeriods: 'Minimum number of staking periods',
  maxNumInactivityPeriods: 'Maximum number of inactivity periods',
  livenessPeriod: 'Liveness period',
  timeForEmissions: 'Time for emissions',
  numAgentInstances: 'Number of agent instances',
  agentIds: 'Agent Ids',
  threshold: 'Multisig threshold',
  configHash: 'Service configuration hash',
  activityChecker: 'Activity checker address',
};

export const TextWithTooltip = ({
  text,
  description,
}: {
  text: string;
  description: string | React.ReactNode;
}) => (
  <Tooltip color={COLOR.WHITE} title={<Paragraph className="m-0">{description}</Paragraph>}>
    <Text type="secondary">
      {text} <InfoCircleOutlined className="ml-4" />
    </Text>
  </Tooltip>
);

export const MaxNumServicesLabel = () => (
  <TextWithTooltip
    text={LABELS.maxNumServices}
    description={
      <>
        How many agents do you need running? Agents can be sovereign or decentralized agents. They
        join the contract on a first come, first serve basis.
        <br />
        <a href="https://olas.network/learn" target="_blank">
          Learn more {UNICODE_SYMBOLS.EXTERNAL_LINK}
        </a>
      </>
    }
  />
);

export const RewardsPerSecondLabel = () => (
  <TextWithTooltip
    text={LABELS.rewardsPerSecond}
    description="Token rewards come from the Olas protocol"
  />
);

export const TemplateInfo = () => (
  <TextWithTooltip text="Template" description="Template contracts must be approved by DAO vote" />
);
/**
 * function to get field rules
 * @param label
 * @returns
 */
export const getFieldRules = (label: string) => [
  { required: true, message: `Please enter ${label}` },
];
