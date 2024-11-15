import {
  getAgentContract,
  fetchGraphQLData,
} from 'common-util/Contracts';
import { getListByAccount } from 'common-util/ContractUtils/myList';
import { getFirstAndLastIndex } from 'common-util/functions';

// --------- HELPER METHODS ---------
export const getAgentOwner = (id) => new Promise((resolve, reject) => {
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

const getAgentsHelper = (startIndex, promiseList, resolve) => {
  const mechDataPromise = fetchGraphQLData(); // Get the promise for mechData from the GraphQL
  Promise.all(promiseList).then(async (agentsList) => {
    mechDataPromise.then((mechData) => {
      const results = agentsList.map(async (info, i) => {
        const agentId = `${startIndex + i}`;
        const owner = await getAgentOwner(agentId);
        const mechForCurrentAgent = mechData.find((e) => e.agentId === agentId);
        const updatedInfo = {
          ...info,
          mech: mechForCurrentAgent?.mech,
        };
        return { ...updatedInfo, owner };
      });
      Promise.all(results).then((resolvedResults) => {
        resolve(resolvedResults);
      });
    });
  });
};

// --------- utils ---------
export const getAgent = (id) => new Promise((resolve, reject) => {
  const contract = getAgentContract();

  contract.methods
    .getHashes(id)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      console.error(e);
      reject(e);
    });
});
// totals
export const getTotalForAllAgents = () => new Promise((resolve, reject) => {
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

export const getTotalForMyAgents = (account) => new Promise((resolve, reject) => {
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
export const getAgents = (total, nextPage = 1) => new Promise((resolve, reject) => {
  try {
    const allAgentsPromises = [];

    const { first, last } = getFirstAndLastIndex(total, nextPage);
    for (let i = first; i <= last; i += 1) {
      const agentId = `${i}`;
      const result = getAgent(agentId);
      allAgentsPromises.push(result);
    }

    getAgentsHelper(first, allAgentsPromises, resolve);
  } catch (e) {
    console.error(e);
    reject(e);
  }
});
