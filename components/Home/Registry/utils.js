import { notification } from 'antd';

import {
  getMechMinterContract,
  getAgentContract,
  fetchMechAgents,
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

const getAgentsHelper = ({ first, total, resolve }) => {
  // Get the promise for mechData from the GraphQL
  const mechDataPromise = fetchMechAgents({ total, first });

  // Promise.all(promiseList).then(async (agentsList) => {
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
  // });
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
    const { first } = getFirstAndLastIndex(total, nextPage);
    getAgentsHelper({ total, first: first - 1, resolve });
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
