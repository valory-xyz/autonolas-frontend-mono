import { notification } from 'antd/lib';
import {
  getMechMinterContract,
  getAgentContract,
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

/**
 * helper to return the list of details (table in index page)
 */
const getAgentsHelper = (startIndex, promiseList, resolve) => {
  Promise.all(promiseList).then(async (agentsList) => {
    const results = await Promise.all(
      agentsList.map(async (info, i) => {
        const owner = await getAgentOwner(`${startIndex + i}`);
        return { ...info, owner };
      }),
    );
    resolve(results);
  });
};

// --------- utils ---------
export const getAgentDetails = (id) => new Promise((resolve, reject) => {
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
export const getAgents = (total, nextPage) => new Promise((resolve, reject) => {
  const contract = getAgentContract();

  try {
    const allAgentsPromises = [];

    const { first, last } = getFirstAndLastIndex(total, nextPage);
    for (let i = first; i <= last; i += 1) {
      const agentId = `${i}`;
      const result = contract.methods.getUnit(agentId).call();
      allAgentsPromises.push(result);
    }

    getAgentsHelper(first, allAgentsPromises, resolve);
  } catch (e) {
    console.error(e);
    reject(e);
  }
});

export const getAgentHashes = (id) => new Promise((resolve, reject) => {
  const contract = getAgentContract();

  contract.methods
    .getUpdatedHashes(id)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      console.error(e);
      reject(e);
    });
});

export const updateAgentHashes = (account, id, newHash) => {
  const contract = getMechMinterContract();

  // 0 to indicate `agents`
  contract.methods
    .updateHash('0', id, `0x${newHash}`)
    .send({ from: account })
    .then(() => {
      notification.success({ message: 'Hash Updated' });
    })
    .catch((e) => {
      notification.error({ message: 'Some error occured' });
      console.error(e);
    });
};

export const getTokenUri = (id) => new Promise((resolve, reject) => {
  const contract = getAgentContract();

  contract.methods
    .tokenURI(id)
    .call()
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      console.error(e);
      reject(e);
    });
});
