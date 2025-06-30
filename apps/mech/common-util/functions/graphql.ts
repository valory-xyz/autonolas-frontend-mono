import { MECH_MARKETPLACE_SUBGRAPH_URLS } from 'util/constants';

import { getChainId } from '.';

type FetchMechAgentsArgs = {
  first: number;
  total: number;
};

export type Agent = {
  id: number;
  agentHash: string;
  mech: string;
};

export async function fetchMechAgents({ first, total }: FetchMechAgentsArgs): Promise<Agent[] | Error> {
  return new Promise((resolve, reject) => {
    const url = process.env.NEXT_PUBLIC_MECH_SUBGRAPH_URL;
    if (!url) {
      throw new Error('Mech Subgraph URL is not provided');
    }

    const query = `
      {
        mechAgents(first: ${total}, skip: ${first}, orderBy: id, order: asc) {
          id
          mech
          agentHash
        }
      }
    `;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Error fetching data: ${response.statusText}`);
      })
      .then((data: { data: { mechAgents: Agent[] } }) => {
        resolve(data.data.mechAgents);
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}

type FetchMmMechsArgs = {
  first: number;
  total: number;
  filters: {
    owner?: string;
    searchValue?: string;
  };
};

export type MmMech = {
  id: number;
  address: string;
  mechFactory: string;
  configHash: string;
  owner: string;
};

export async function fetchMmMechs({ first, total, filters }: FetchMmMechsArgs): Promise<MmMech[] | Error> {
  return new Promise((resolve, reject) => {
    const chainId = getChainId();
    const url = MECH_MARKETPLACE_SUBGRAPH_URLS[chainId];

    if (!url) {
      throw new Error('Mech Marketplace Subgraph URL is not provided');
    }

    const query = `
      {
        meches(first: ${total}, skip: ${first}, orderBy: id, order: asc, 
        where: {
          and: [
            ${filters.owner ? `{owner: "${filters.owner}"}` : '{}'}
            ${
              filters.searchValue
                ? `
              {
                or: [
                  { owner_contains: "${filters.searchValue}" },
                  { configHash_contains: "${filters.searchValue}" },
                ]
              }
            `
                : '{}'
            }
          ]
        }
        ) {
          id
          address
          mechFactory
          configHash
          owner
        }
      }
    `;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Error fetching mechs: ${response.statusText}`);
      })
      .then((data: { data: { meches: MmMech[] } }) => {
        resolve(data.data.meches);
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}

export async function fetchMmMechsTotal() {
  return new Promise((resolve, reject) => {
    const chainId = getChainId();
    const url = MECH_MARKETPLACE_SUBGRAPH_URLS[chainId];

    if (!url) {
      throw new Error('Mech Marketplace Subgraph URL is not provided');
    }

    const query = `
      {
        global(id: "") {
          id
          totalMechs
        }
      }
    `;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Error fetching mechs total: ${response.statusText}`);
      })
      .then((data) => {
        if (!data.data.global) {
          resolve({ totalMechs: 0 });
        } else {
          resolve(data.data.global.totalMechs);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
