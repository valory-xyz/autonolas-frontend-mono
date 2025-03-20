import { getListByAccount } from 'common-util/ContractUtils/myList';
import { getAgentContract } from 'common-util/Contracts';
import { getFirstAndLastIndex } from 'common-util/functions';
import { fetchMechAgents, fetchMmMechs, fetchMmMechsTotal } from 'common-util/functions/graphql';

// --------- HELPER METHODS ---------
export const getAgentOwner = (id) =>
  new Promise((resolve, reject) => {
    const contract = getAgentContract();

    contract.methods
      .ownerOf(id)
      .call()
      .then((response) => {
        resolve(response);
      })
      .catch((e) => {
        console.error(e);
        reject(e);
      });
  });

const getAgentsHelper = ({ first, total, resolve }) => {
  // Get the promise for mechData from the GraphQL
  const mechDataPromise = fetchMechAgents({ total, first });

  mechDataPromise.then((mechAgents) => {
    const results = mechAgents.map(async (agent) => {
      const agentId = Number(agent.id);
      const owner = await getAgentOwner(agentId);

      const agentInfo = {
        id: agentId,
        owner,
        hash: agent.agentHash,
        mech: agent.mech,
      };

      return agentInfo;
    });
    Promise.all(results).then((resolvedResults) => {
      resolve(resolvedResults);
    });
  });
};

const getMechsHelper = ({ first, total, filters, resolve }) => {
  // Get the promise for mechData from the GraphQL
  const mechDataPromise = fetchMmMechs({
    total,
    first,
    filters,
  });

  mechDataPromise.then((mechs) => {
    const results = mechs.map(async (mech) => {
      const serviceId = Number(mech.id);

      const mechInfo = {
        id: serviceId,
        address: mech.address,
        owner: mech.owner,
        hash: mech.configHash,
        mechFactory: mech.mechFactory,
      };

      return mechInfo;
    });
    Promise.all(results).then((resolvedResults) => {
      resolve(resolvedResults);
    });
  });
};

// --------- utils ---------
export const getAgentDetails = (id) =>
  new Promise((resolve, reject) => {
    const contract = getAgentContract();

    contract.methods
      .getUnit(id)
      .call()
      .then((information) => {
        resolve(information);
      })
      .catch((e) => {
        console.error(e);
        reject(e);
      });
  });

// totals
export const getTotalForAllAgents = () =>
  new Promise((resolve, reject) => {
    const contract = getAgentContract();

    contract.methods
      .totalSupply()
      .call()
      .then((response) => {
        resolve(response);
      })
      .catch((e) => {
        reject(e);
      });
  });

export const getTotalForMyAgents = (account) =>
  new Promise((resolve, reject) => {
    const contract = getAgentContract();
    contract.methods
      .balanceOf(account)
      .call()
      .then((response) => {
        resolve(response);
      })
      .catch((e) => {
        reject(e);
      });
  });

export const getFilteredAgents = async (searchValue, account) => {
  const contract = getAgentContract();
  const total = await getTotalForAllAgents();
  const { getUnit } = contract.methods;

  return getListByAccount({
    searchValue,
    total,
    getUnit,
    getOwner: getAgentOwner,
    account,
  });
};

/**
 * Function to return all agents
 */
export const getAgents = (total, nextPage = 1) =>
  new Promise((resolve, reject) => {
    try {
      const { first } = getFirstAndLastIndex(total, nextPage);
      getAgentsHelper({ total, first: first - 1, resolve });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });

/**
 * Function to return all mechs
 */
export const getMechs = (total, nextPage = 1, filters = {}) =>
  new Promise((resolve, reject) => {
    try {
      const { first } = getFirstAndLastIndex(total, nextPage);
      getMechsHelper({
        total,
        first: first - 1,
        filters,
        resolve,
      });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });

/**
 * Function to return total mechs
 */
export const getTotalMechs = () =>
  new Promise((resolve, reject) => {
    try {
      fetchMmMechsTotal().then((result) => resolve(result));
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
