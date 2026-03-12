import { ethers } from 'ethers';

import { notifyError, getEstimatedGasLimit } from 'libs/util-functions/src';

import {
  getGenericErc20Contract,
  getServiceContract,
  getServiceManagerContract,
  getServiceRegistryTokenUtilityContract,
} from 'common-util/Contracts';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getTokenDetailsRequest } from 'common-util/Details/utils';
import { sendTransaction } from 'common-util/functions';
import { DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS } from 'util/constants';

import { transformDatasourceForServiceTable, transformSlotsAndBonds } from '../helpers/functions';

/* ----- helper functions ----- */

// params.agentParams.slots[i] = total initial available Slots for the i-th service.agentIds;

/**
 *
 * @param {String} id serviceId
 * @param {Array} tableDataSource dataSource of the table and it can be null or undefined
 * @returns {Promise<Object>} { totalBonds, bondsArray, slotsArray }
 */
export const getBonds = async (id, tableDataSource) => {
  const serviceContract = getServiceContract();
  const response = await serviceContract.methods.getAgentParams(id).call();

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

  const transformedSlotsAndBonds = transformSlotsAndBonds(slotsArray, bondsArray, tableDataSource);
  return transformedSlotsAndBonds;
};

/* ----- common functions ----- */
export const onTerminate = async (account, id) => {
  const contract = await getServiceManagerContract();
  const terminateFn = contract.methods.terminate(id);
  const estimatedGas = await getEstimatedGasLimit(terminateFn, account);
  const fn = terminateFn.send({
    from: account,
    gasLimit: estimatedGas,
  });
  const response = await sendTransaction(fn, account);
  return response;
};

export const getServiceOwner = async (id) => {
  const contract = getServiceContract();
  const response = await contract.methods.ownerOf(id).call();
  return response;
};

const hasSufficientTokenRequest = async ({ account, chainId, serviceId, amountToApprove }) => {
  /**
   * - fetch the token address from the serviceId
   * - fetch the allowance of the token using the token address
   */
  const { token } = await getTokenDetailsRequest(serviceId);
  const contract = getGenericErc20Contract(token);
  const response = await contract.methods
    .allowance(account, ADDRESSES[chainId].serviceRegistryTokenUtility)
    .call();
  return !(ethers.getBigInt(response) < amountToApprove);
};

/**
 * Approves token
 */
const approveToken = async ({ account, chainId, serviceId, amountToApprove }) => {
  const { token } = await getTokenDetailsRequest(serviceId);
  const contract = getGenericErc20Contract(token);
  const fn = contract.methods
    .approve(ADDRESSES[chainId].serviceRegistryTokenUtility, amountToApprove)
    .send({ from: account });

  const response = await sendTransaction(fn, account);
  return response;
};

export const checkAndApproveToken = async ({ account, chainId, serviceId, amountToApprove }) => {
  const hasTokenBalance = await hasSufficientTokenRequest({
    account,
    chainId,
    serviceId,
    amountToApprove,
  });

  if (!hasTokenBalance) {
    const response = await approveToken({
      account,
      chainId,
      serviceId,
      amountToApprove,
    });
    return response;
  }

  return null;
};

/* ----- step 1 functions ----- */
export const checkIfEth = async (id) => {
  const { token } = await getTokenDetailsRequest(id);
  return token === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS;
};

export const onActivateRegistration = async (id, account, deposit) => {
  const contract = await getServiceManagerContract();
  const activateRegistrationFn = contract.methods.activateRegistration(id);
  const estimatedGas = await getEstimatedGasLimit(activateRegistrationFn, account, deposit);
  const fn = contract.methods.activateRegistration(id).send({
    from: account,
    gasLimit: estimatedGas,
    value: deposit,
  });

  const response = await sendTransaction(fn, account);
  return response;
};

/* ----- step 2 functions ----- */
/**
 * @typedef {Object} DataSource
 * @property {string} key
 * @property {string} agentId
 * @property {number} availableSlots
 * @property {number} totalSlots
 * @property {number} bond
 * @property {string} agentAddresses
 *
 */
/**
 *
 * @param {String} id
 * @param {String[]} agentIds
 * @returns {Promise<DataSource[]>}
 *
 * @example
 * {
 *   agentAddresses: null
 *   agentId: "2"
 *   availableSlots: 0
 *   bond: "1000000000000000"
 *   key: "2"
 *   totalSlots: "4"
 * }
 */
export const getServiceTableDataSource = async (id, agentIds) => {
  const contract = getServiceContract();
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
      const info = await contract.methods.getInstancesForAgentId(id, agentId).call();
      return info.numAgentInstances;
    }),
  );

  const dateSource = transformDatasourceForServiceTable({
    agentIds,
    numAgentInstances: numAgentInstancesArray,
    slots,
    bonds,
  });
  return dateSource;
};

export const checkIfAgentInstancesAreValid = async ({ account, agentInstances }) => {
  const contract = getServiceContract();

  // check if the operator is registered as an agent instance already
  const operator = await contract.methods.mapAgentInstanceOperators(account).call();
  if (operator !== DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS) {
    notifyError('The operator is registered as an agent instance already.');
    return false;
  }

  // check if the agent instances are valid
  const agentInstanceAddressesPromises = agentInstances.map(async (agentInstance) => {
    const eachAgentInstance = await contract.methods
      .mapAgentInstanceOperators(agentInstance)
      .call();
    return eachAgentInstance;
  });

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
  const contract = await getServiceManagerContract();
  const { totalBonds } = await getBonds(serviceId, dataSource);

  const registerAgentsFn = contract.methods.registerAgents(serviceId, agentInstances, agentIds);
  const estimatedGas = await getEstimatedGasLimit(registerAgentsFn, account, `${totalBonds}`);
  const fn = registerAgentsFn.send({
    from: account,
    gasLimit: estimatedGas,
    value: `${totalBonds}`,
  });
  const response = await sendTransaction(fn, account);
  return response;
};

export const getTokenBondRequest = async (id, source) => {
  const contract = getServiceRegistryTokenUtilityContract();
  return Promise.all(
    (source || []).map(async ({ agentId }) => {
      const bond = await contract.methods.getAgentBond(id, agentId).call();
      return bond;
    }),
  );
};

export const getServiceAgentInstances = async (id) => {
  const contract = getServiceContract();
  const response = await contract.methods.getAgentInstances(id).call();
  return response?.agentInstances;
};

export const onStep3Deploy = async (account, id, radioValue, payload = '0x') => {
  const contract = await getServiceManagerContract();

  const deployFn = contract.methods.deploy(id, radioValue, payload);
  const estimatedGas = await getEstimatedGasLimit(deployFn, account);
  const fn = deployFn.send({ from: account, gasLimit: estimatedGas });
  const response = await sendTransaction(fn, account, { isLegacy: true });
  return response;
};

/* ----- step 4 functions ----- */
export const getAgentInstanceAndOperator = async (id) => {
  const contract = getServiceContract();
  const response = await contract.methods.getAgentInstances(id).call();
  const data = await Promise.all(
    (response?.agentInstances || []).map(async (key, index) => {
      const operatorAddress = await contract.methods.mapAgentInstanceOperators(key).call();
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
  const contract = await getServiceManagerContract();
  const unbondFn = contract.methods.unbond(id);
  const estimatedGas = await getEstimatedGasLimit(unbondFn, account);
  const fn = unbondFn.send({ from: account, gasLimit: estimatedGas });
  const response = await sendTransaction(fn, account);
  return response;
};
