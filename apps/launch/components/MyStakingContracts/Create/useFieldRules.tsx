import { Rule } from 'antd/es/form';

import { FORM_VALIDATION } from 'libs/util-functions/src';

import {
  useApyLimit,
  useMinStakingDepositLimit,
  useNumServicesLimit,
  useTimeForEmissionsLimit,
} from 'hooks/useStakingVerifier';

import { FieldConfig, FormValues } from '../FieldConfig';

const ONE_YEAR = 1 * 24 * 60 * 60 * 365;

/**
 * function to get generic field rules
 */
const getGenericFieldRules = (label: string) => [
  { required: true, message: `Please enter ${label}` },
];

type StakingDepositRules = { [K in keyof FormValues]: { rules: Rule[] | undefined } };
export const useFieldRules = (): StakingDepositRules => {
  const { data: numServicesLimit } = useNumServicesLimit();
  const { data: minStakingDepositLimit } = useMinStakingDepositLimit();
  const { data: timeForEmissionsLimit } = useTimeForEmissionsLimit();
  const { data: apyLimit } = useApyLimit();

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
    rewardsPerSecond: {
      rules: [
        ...getGenericFieldRules(FieldConfig.rewardsPerSecond.name),
        {
          // BE validation from https://github.com/valory-xyz/autonolas-registries/blob/main/contracts/staking/StakingVerifier
          validator: async (_, value) => {
            if (!minStakingDepositLimit) return Promise.resolve();
            if (!apyLimit) return Promise.resolve();

            const rewardsPerYear = value * ONE_YEAR;
            const apy = (rewardsPerYear * 1e18) / 1000;

            if (apy > apyLimit) {
              return Promise.reject('The rewards per second must be below the allowed limit');
            }
          },
        },
      ],
    },
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
        // TODO: any comments on this validation?
        // {
        //   type: 'number',
        //   min: 86400,
        //   max: 86400 * 30,
        //   message: `Liveness period must be between 24 hours and 30 days`,
        // },
      ],
    },
    timeForEmissions: {
      rules: [
        ...getGenericFieldRules(FieldConfig.timeForEmissions.name),
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
