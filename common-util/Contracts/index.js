import Web3 from 'web3';
import {
  AGENT_FACTORY_ADDRESS,
  AGENT_FACTORY_ABI,
  AGENT_MECH_ABI,
  AGENT_REGISTRY_ADDRESS,
  AGENT_REGISTRY_ABI,
} from 'common-util/AbiAndAddresses';
import { getChainId, getProvider } from 'common-util/functions';
import { DEFAULT_MECH_CONTRACT_ADDRESS } from 'util/constants';

export const RPC_URLS = {
  100: process.env.NEXT_PUBLIC_GNOSIS_URL,
};

export const ADDRESSES = {
  100: {
    agentRegistry: AGENT_REGISTRY_ADDRESS,
    agentFactory: AGENT_FACTORY_ADDRESS,
  },
};

const getWeb3Details = () => {
  const web3 = new Web3(getProvider());
  const chainId = getChainId();
  const address = ADDRESSES[chainId];

  return { web3, address, chainId };
};

const getContract = (abi, contractAddress) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

export const getAgentContract = () => {
  const contract = getContract(AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS);
  return contract;
};

export const getMechMinterContract = () => {
  const contract = getContract(AGENT_FACTORY_ABI, AGENT_FACTORY_ADDRESS);

  return contract;
};

export const getMechContract = () => {
  const contract = getContract(AGENT_MECH_ABI, DEFAULT_MECH_CONTRACT_ADDRESS);

  return contract;
};

export async function fetchMechAgents({ first, total }) {
  return new Promise((resolve, reject) => {
    const url = process.env.NEXT_PUBLIC_MECH_SUBGRAPH_URL;
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
