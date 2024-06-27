import { formatEther, Address } from 'viem';

import { DetailsRewardRecord, DetailsValue } from 'types/details';

import {
  getOperatorWhitelistContract,
  getServiceRegistryTokenUtilityContract,
} from '../../Contracts';
import { sendTransaction } from '../../functions';
import { isNaN, isNil } from 'lodash';
import BigNumber from 'bignumber.js';

export const getTokenDetailsRequest = async (serviceId: BigNumber) => {
  const contract = getServiceRegistryTokenUtilityContract();
  const deposit = await contract.methods.mapServiceIdTokenDeposit(serviceId).call();
  return deposit;
};

/* ----- operator whitelist functions ----- */
export const checkIfServiceRequiresWhitelisting = async (serviceId: number) => {
  const contract = getOperatorWhitelistContract();
  // if true: it is whitelisted by default
  // else we can whitelist using the input field
  const response = await contract.methods.mapServiceIdOperatorsCheck(serviceId).call();
  return response;
};

export const checkIfServiceIsWhitelisted = async (serviceId: number, operatorAddress: Address) => {
  const contract = getOperatorWhitelistContract();
  const response = await contract.methods.isOperatorWhitelisted(serviceId, operatorAddress).call();
  return response;
};

export const setOperatorsCheckRequest = async ({
  account,
  serviceId,
  isChecked,
}: {
  account: Address;
  serviceId: string;
  isChecked: boolean;
}) => {
  const contract = getOperatorWhitelistContract();
  const fn = contract.methods.setOperatorsCheck(serviceId, isChecked).send({ from: account });
  const response = await sendTransaction(fn, account);
  return response;
};

export const setOperatorsStatusesRequest = async ({
  account,
  serviceId,
  operatorAddresses,
  operatorStatuses,
}: {
  account: Address;
  serviceId: string;
  operatorAddresses: Address[];
  operatorStatuses: boolean[];
}) => {
  const contract = getOperatorWhitelistContract();
  const fn = contract.methods
    .setOperatorsStatuses(serviceId, operatorAddresses, operatorStatuses, true)
    .send({ from: account });
  const response = await sendTransaction(fn, account);
  return response;
};

export const formatOwnerIncentive = (ownerIncentive: { reward: string; topUp: string }) => ({
  reward: parseFloat(formatEther(ownerIncentive.reward)).toLocaleString('en', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }),
  topUp: parseFloat(formatEther(ownerIncentive.topUp)).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
});

export const isDetailsValueRewards = (
  detailsValue: DetailsValue,
): detailsValue is DetailsValue<DetailsRewardRecord> =>
  !isNil((detailsValue as DetailsValue<DetailsRewardRecord>).value?.reward) &&
  !isNil((detailsValue as DetailsValue<DetailsRewardRecord>).value?.topUp)

export const isDetailsValueDependency = (
  detailsValue: DetailsValue,
): detailsValue is DetailsValue<number> => !isNaN((detailsValue as DetailsValue<number>).value)

