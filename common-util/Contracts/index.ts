import { Address } from 'viem';
import { base, gnosis } from 'wagmi/chains';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import {
  AGENT_MECH_ABI,
  AGENT_REGISTRY_ABI,
  AGENT_REGISTRY_ADDRESSES,
  MECH_MARKETPLACE_ADDRESSES,
} from 'common-util/AbiAndAddresses';
import { getChainId, getProvider } from 'common-util/functions';
import { Network } from 'types/index';
import { DEFAULT_MECH_CONTRACT_ADDRESS, MECH_MARKETPLACE_SUBGRAPH_URLS } from 'util/constants';

export const RPC_URLS: Record<Network, string> = {
  [gnosis.id]: process.env.NEXT_PUBLIC_GNOSIS_URL ?? gnosis.rpcUrls.default.http[0],
  [base.id]: process.env.NEXT_PUBLIC_BASE_URL ?? base.rpcUrls.default.http[0],
};

export const ADDRESSES: Record<Network, { agentRegistry: Address; mechMarketplace: Address }> = {
  [gnosis.id]: {
    agentRegistry: AGENT_REGISTRY_ADDRESSES[gnosis.id],
    mechMarketplace: MECH_MARKETPLACE_ADDRESSES[gnosis.id],
  },
  [base.id]: {
    agentRegistry: AGENT_REGISTRY_ADDRESSES[base.id],
    mechMarketplace: MECH_MARKETPLACE_ADDRESSES[base.id],
  },
};

const getWeb3Details = () => {
  const web3 = new Web3(getProvider());
  const chainId = getChainId();
  const address = chainId ? ADDRESSES[chainId] : null;

  return { web3, address, chainId };
};

const getContract = (abi: AbiItem[], contractAddress: string) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

export const getAgentContract = () => {
  const agentRegistryAddress = getWeb3Details().address?.agentRegistry;
  if (!agentRegistryAddress) {
    throw new Error('Unsupported network, agent registry address not found.');
  }

  // @ts-ignore TODO: fix ABI type
  const contract = getContract(AGENT_REGISTRY_ABI, agentRegistryAddress);
  return contract;
};

export const getMechContract = () => {
  // @ts-ignore TODO: fix ABI type
  // TODO: fix default contract, should be the one from the URL
  // seems to be broken long time ago
  const contract = getContract(AGENT_MECH_ABI, DEFAULT_MECH_CONTRACT_ADDRESS);

  return contract;
};

type FetchMechAgentsArgs = {
  first: number;
  total: number;
};

export async function fetchMechAgents({ first, total }: FetchMechAgentsArgs) {
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
      .then((data) => {
        resolve(data.data.mechAgents);
      })
      .catch((error) => {
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

export async function fetchMmMechs({ first, total, filters }: FetchMmMechsArgs) {
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
      .then((data) => {
        resolve(data.data.meches);
      })
      .catch((error) => {
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
