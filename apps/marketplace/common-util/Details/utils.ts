import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { Address } from 'viem';

import { wagmiConfig } from 'common-util/Login/config';
import {
  operatorWhitelistParams,
  serviceRegistryTokenUtilityParams,
} from 'common-util/Contracts/params';
import { requireChainId } from 'common-util/functions';

export const getTokenDetailsRequest = async (serviceId: string) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...serviceRegistryTokenUtilityParams(chainId),
    functionName: 'mapServiceIdTokenDeposit',
    args: [BigInt(serviceId)],
  });
};

/* ----- operator whitelist functions ----- */
export const checkIfServiceRequiresWhitelisting = async (serviceId: string) => {
  const chainId = requireChainId();
  // if true: it is whitelisted by default
  // else we can whitelist using the input field
  return readContract(wagmiConfig, {
    ...operatorWhitelistParams(chainId),
    functionName: 'mapServiceIdOperatorsCheck',
    args: [BigInt(serviceId)],
  });
};

export const checkIfServiceIsWhitelisted = async (serviceId: string, operatorAddress: Address) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...operatorWhitelistParams(chainId),
    functionName: 'isOperatorWhitelisted',
    args: [BigInt(serviceId), operatorAddress],
  });
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
  const chainId = requireChainId();
  const { request } = await simulateContract(wagmiConfig, {
    ...operatorWhitelistParams(chainId),
    functionName: 'setOperatorsCheck',
    args: [BigInt(serviceId), isChecked],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  return waitForTransactionReceipt(wagmiConfig, { hash });
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
  const chainId = requireChainId();
  const { request } = await simulateContract(wagmiConfig, {
    ...operatorWhitelistParams(chainId),
    functionName: 'setOperatorsStatuses',
    args: [BigInt(serviceId), operatorAddresses, operatorStatuses, true],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  return waitForTransactionReceipt(wagmiConfig, { hash });
};
