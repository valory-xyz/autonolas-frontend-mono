import { Address } from 'viem';

import { getOperatorWhitelistContract, getServiceRegistryTokenUtilityContract } from '../Contracts';
import { sendTransaction } from '../functions';

export const getTokenDetailsRequest = async (serviceId: string) => {
  const contract = getServiceRegistryTokenUtilityContract();
  const deposit = await contract.methods.mapServiceIdTokenDeposit(serviceId).call();
  return deposit;
};

/* ----- operator whitelist functions ----- */
export const checkIfServiceRequiresWhitelisting = async (serviceId: string) => {
  const contract = getOperatorWhitelistContract();
  // if true: it is whitelisted by default
  // else we can whitelist using the input field
  const response = await contract.methods.mapServiceIdOperatorsCheck(serviceId).call();
  return response;
};

export const checkIfServiceIsWhitelisted = async (serviceId: string, operatorAddress: Address) => {
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
