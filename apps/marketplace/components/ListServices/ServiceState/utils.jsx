import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { ethers } from 'ethers';

import { notifyError } from 'libs/util-functions/src';
import { estimateGasWithBuffer } from 'libs/util-functions/src/lib/estimateGasWithBuffer';

import {
  genericErc20Params,
  serviceManagerParams,
  serviceRegistryParams,
  serviceRegistryTokenUtilityParams,
} from 'common-util/Contracts/params';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getTokenDetailsRequest } from 'common-util/Details/utils';
import { requireChainId } from 'common-util/functions';
import { wagmiConfig } from 'common-util/Login/config';
import { DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS } from 'util/constants';

import { transformDatasourceForServiceTable, transformSlotsAndBonds } from '../helpers/functions';

/* ----- helper functions ----- */

/**
 * @param {String} id serviceId
 * @param {Array} tableDataSource dataSource of the table and it can be null or undefined
 * @returns {Promise<Object>} { totalBonds, bondsArray, slotsArray }
 */
export const getBonds = async (id, tableDataSource) => {
  const chainId = requireChainId();
  const response = await readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'getAgentParams',
    args: [BigInt(id)],
  });

  const bondsArray = [];
  const slotsArray = [];
  for (let i = 0; i < response.agentParams.length; i += 1) {
    /**
     * agentParams = [{ slots: 2, bond: 2000 }, { slots: 3, bond: 4000 }]
     * slotsArray = [2, 3]
     * bondsArray = [2000, 4000]
     */
    const { bond, slots } = response.agentParams[i];
    slotsArray.push(slots);
    bondsArray.push(bond);
  }

  return transformSlotsAndBonds(slotsArray, bondsArray, tableDataSource);
};

/* ----- common functions ----- */
export const onTerminate = async (account, id) => {
  const chainId = requireChainId();
  const params = await serviceManagerParams(chainId);
  const callParams = {
    ...params,
    functionName: 'terminate',
    args: [BigInt(id)],
    account,
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
  const hash = await writeContract(wagmiConfig, { ...request, gas });
  return waitForTransactionReceipt(wagmiConfig, { hash });
};

export const getServiceOwner = async (id) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'ownerOf',
    args: [BigInt(id)],
  });
};

const hasSufficientTokenRequest = async ({ account, chainId, serviceId, amountToApprove }) => {
  /**
   * - fetch the token address from the serviceId
   * - fetch the allowance of the token using the token address
   */
  const { token } = await getTokenDetailsRequest(serviceId);
  const response = await readContract(wagmiConfig, {
    ...genericErc20Params(token, chainId),
    functionName: 'allowance',
    args: [account, ADDRESSES[chainId].serviceRegistryTokenUtility],
  });
  return !(ethers.getBigInt(response) < amountToApprove);
};

/** Approves token */
const approveToken = async ({ account, chainId, serviceId, amountToApprove }) => {
  const { token } = await getTokenDetailsRequest(serviceId);
  const callParams = {
    ...genericErc20Params(token, chainId),
    functionName: 'approve',
    args: [ADDRESSES[chainId].serviceRegistryTokenUtility, amountToApprove],
    account,
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
  const hash = await writeContract(wagmiConfig, { ...request, gas });
  return waitForTransactionReceipt(wagmiConfig, { hash });
};

export const checkAndApproveToken = async ({ account, chainId, serviceId, amountToApprove }) => {
  const hasTokenBalance = await hasSufficientTokenRequest({
    account,
    chainId,
    serviceId,
    amountToApprove,
  });

  if (!hasTokenBalance) {
    return approveToken({ account, chainId, serviceId, amountToApprove });
  }

  return null;
};

/* ----- step 1 functions ----- */
export const checkIfEth = async (id) => {
  const { token } = await getTokenDetailsRequest(id);
  return token === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS;
};

export const onActivateRegistration = async (id, account, deposit) => {
  const chainId = requireChainId();
  const params = await serviceManagerParams(chainId);
  const callParams = {
    ...params,
    functionName: 'activateRegistration',
    args: [BigInt(id)],
    account,
    value: BigInt(deposit),
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
  const hash = await writeContract(wagmiConfig, { ...request, gas });
  return waitForTransactionReceipt(wagmiConfig, { hash });
};

/* ----- step 2 functions ----- */
/**
 * @param {String} id
 * @param {String[]} agentIds
 */
export const getServiceTableDataSource = async (id, agentIds) => {
  const chainId = requireChainId();
  const { slots, bonds } = await getBonds(id);

  /**
   * for each agent Id, we call instances = getInstancesForAgentId(serviceId, agentId):
   * instances.numAgentInstances will give the number of occupied instances slots, so in
   * the Available Slots row you subtract params.agentParams.slots[i] -
   * instances.numAgentInstances, considering the same agentId. And as for Agent Addresses
   * for the correspondent Agent ID, just grab all the values from the:
   * instances.agentInstances
   */
  const numAgentInstancesArray = await Promise.all(
    agentIds.map(async (agentId) => {
      const info = await readContract(wagmiConfig, {
        ...serviceRegistryParams(chainId),
        functionName: 'getInstancesForAgentId',
        args: [BigInt(id), BigInt(agentId)],
      });
      return info.numAgentInstances;
    }),
  );

  return transformDatasourceForServiceTable({
    agentIds,
    numAgentInstances: numAgentInstancesArray,
    slots,
    bonds,
  });
};

export const checkIfAgentInstancesAreValid = async ({ account, agentInstances }) => {
  const chainId = requireChainId();

  // check if the operator is registered as an agent instance already
  const operator = await readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'mapAgentInstanceOperators',
    args: [account],
  });
  if (operator !== DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS) {
    notifyError('The operator is registered as an agent instance already.');
    return false;
  }

  // check if the agent instances are valid
  const agentInstanceAddressesPromises = agentInstances.map((agentInstance) =>
    readContract(wagmiConfig, {
      ...serviceRegistryParams(chainId),
      functionName: 'mapAgentInstanceOperators',
      args: [agentInstance],
    }),
  );

  const ifValidArray = (await Promise.all(agentInstanceAddressesPromises)).some(
    (eachAgentInstance) => eachAgentInstance === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS,
  );

  if (!ifValidArray) {
    notifyError('The agent instance address is already registered.');
    return false;
  }

  return true;
};

export const onStep2RegisterAgents = async ({
  account,
  serviceId,
  agentIds,
  agentInstances,
  dataSource,
}) => {
  const chainId = requireChainId();
  const params = await serviceManagerParams(chainId);
  const { totalBonds } = await getBonds(serviceId, dataSource);

  const callParams = {
    ...params,
    functionName: 'registerAgents',
    args: [BigInt(serviceId), agentInstances, agentIds.map(BigInt)],
    account,
    value: BigInt(totalBonds),
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
  const hash = await writeContract(wagmiConfig, { ...request, gas });
  return waitForTransactionReceipt(wagmiConfig, { hash });
};

export const getTokenBondRequest = async (id, source) => {
  const chainId = requireChainId();
  return Promise.all(
    (source || []).map(({ agentId }) =>
      readContract(wagmiConfig, {
        ...serviceRegistryTokenUtilityParams(chainId),
        functionName: 'getAgentBond',
        args: [BigInt(id), BigInt(agentId)],
      }),
    ),
  );
};

export const getServiceAgentInstances = async (id) => {
  const chainId = requireChainId();
  const response = await readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'getAgentInstances',
    args: [BigInt(id)],
  });
  return response?.agentInstances;
};

export const onStep3Deploy = async (account, id, radioValue, payload = '0x') => {
  const chainId = requireChainId();
  const params = await serviceManagerParams(chainId);
  const callParams = {
    ...params,
    functionName: 'deploy',
    args: [BigInt(id), radioValue, payload],
    account,
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
  const hash = await writeContract(wagmiConfig, { ...request, gas });
  return waitForTransactionReceipt(wagmiConfig, { hash });
};

/* ----- step 4 functions ----- */
export const getAgentInstanceAndOperator = async (id) => {
  const chainId = requireChainId();
  const response = await readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'getAgentInstances',
    args: [BigInt(id)],
  });
  const data = await Promise.all(
    (response?.agentInstances || []).map(async (key, index) => {
      const operatorAddress = await readContract(wagmiConfig, {
        ...serviceRegistryParams(chainId),
        functionName: 'mapAgentInstanceOperators',
        args: [key],
      });
      return {
        id: `agent-instance-row-${index + 1}`,
        operatorAddress,
        agentInstance: key,
      };
    }),
  );
  return data;
};

/* ----- step 5 functions ----- */
export const onStep5Unbond = async (account, id) => {
  const chainId = requireChainId();
  const params = await serviceManagerParams(chainId);
  const callParams = {
    ...params,
    functionName: 'unbond',
    args: [BigInt(id)],
    account,
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
  const hash = await writeContract(wagmiConfig, { ...request, gas });
  return waitForTransactionReceipt(wagmiConfig, { hash });
};
