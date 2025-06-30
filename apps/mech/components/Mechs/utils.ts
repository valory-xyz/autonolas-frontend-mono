import { getListByAccount } from 'common-util/ContractUtils/myList';
import { getAgentContract } from 'common-util/Contracts';
import { getFirstAndLastIndex } from 'common-util/functions';
import { fetchMechAgents, fetchMmMechs, fetchMmMechsTotal } from 'common-util/functions/graphql';
import type { Agent, MmMech } from 'common-util/functions/graphql';

// --------- HELPER METHODS ---------
export const getAgentOwner = (id: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const contract = getAgentContract();

    contract.methods
      .ownerOf(id)
      .call()
      .then((response: string) => {
        resolve(response);
      })
      .catch((e: Error) => {
        console.error(e);
        reject(e);
      });
  });

type GetAgentsHelperParams = {
  first: number;
  total: number;
  resolve: (value: AgentInfo[]) => void;
};

export type AgentInfo = {
  id: number;
  owner: string;
  hash: string;
  mech: string;
};

const getAgentsHelper = ({ first, total, resolve }: GetAgentsHelperParams) => {
  // Get the promise for mechData from the GraphQL
  const mechDataPromise = fetchMechAgents({ total, first }) as Promise<Agent[]>;

  mechDataPromise.then((mechAgents) => {
    const results = mechAgents.map(async (agent) => {
      const agentId = Number(agent.id);
      const owner = await getAgentOwner(agentId) as string;

      const agentInfo: AgentInfo = {
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

type GetMechsHelperParams = {
  first: number;
  total: number;
  filters: { owner?: string; searchValue?: string };
  resolve: (value: MechInfo[]) => void;
};

export type MechInfo = {
  id: number;
  address: string;
  owner: string;
  mechFactory: string;
}

const getMechsHelper = ({ first, total, filters, resolve }: GetMechsHelperParams) => {
  // Get the promise for mechData from the GraphQL
  const mechDataPromise = fetchMmMechs({
    total,
    first,
    filters,
  }) as Promise<MmMech[]>;

  mechDataPromise.then((mechs) => {
    const results = mechs.map(async (mech) => {
      const serviceId = Number(mech.id);

      const mechInfo = {
        id: serviceId,
        address: mech.address,
        owner: mech.owner,
        mechFactory: mech.mechFactory,
      };

      return mechInfo;
    });
    Promise.all(results).then((resolvedResults) => {
      resolve(resolvedResults);
    });
  });
};

// totals
export const getTotalForAllAgents = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const contract = getAgentContract();

    contract.methods
      .totalSupply()
      .call()
      .then((response: number) => {
        resolve(response);
      })
      .catch((e: Error) => {
        reject(e);
      });
  });

export const getTotalForMyAgents = (account: string) =>
  new Promise((resolve, reject) => {
    const contract = getAgentContract();
    contract.methods
      .balanceOf(account)
      .call()
      .then((response: number) => {
        resolve(response);
      })
      .catch((e: Error) => {
        reject(e);
      });
  });

export const getFilteredAgents = async (searchValue: string, account: string) => {
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
export const getAgents = (total: number, nextPage: number = 1): Promise<AgentInfo[]> =>
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
export const getMechs = (total: number, nextPage: number = 1, filters: { owner?: string; searchValue?: string } = {}): Promise<MechInfo[]> =>
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
