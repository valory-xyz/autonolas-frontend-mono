import Web3 from 'web3';
import {
  AGENT_FACTORY_ADDRESS,
  AGENT_FACTORY_ABI,
  AGENT_MECH_ABI,
  AGENT_REGISTRY_ADDRESS,
  AGENT_REGISTRY_ABI,
} from 'common-util/AbiAndAddresses';

export const ADDRESSES = {
  100: {
    agentRegistry: AGENT_REGISTRY_ADDRESS,
    agentFactory: AGENT_FACTORY_ADDRESS,
  },
};

export const getWeb3Details = () => {
  /**
   * web3 provider =
   * - wallect-connect provider or
   * - currentProvider by metamask or
   * - fallback to remote mainnet [remote node provider](https://web3js.readthedocs.io/en/v1.7.5/web3.html#example-remote-node-provider)
   */
  const web3 = new Web3(
    window.WEB3_PROVIDER
      || window.web3?.currentProvider
      || process.env.NEXT_PUBLIC_MAINNET_URL,
  );

  const chainId = Number(window.ethereum?.chainId || 1); // default to mainnet
  const address = ADDRESSES[chainId];
  return { web3, address, chainId };
};

export const getAgentContract = () => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(
    AGENT_REGISTRY_ABI,
    AGENT_REGISTRY_ADDRESS,
  );
  return contract;
};

export const getMechMinterContract = () => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(
    AGENT_FACTORY_ABI,
    AGENT_FACTORY_ADDRESS,
  );
  return contract;
};

export const getMechContract = () => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(
    AGENT_MECH_ABI,
    '0xFf82123dFB52ab75C417195c5fDB87630145ae81',
  );
  return contract;
};

export async function fetchGraphQLData() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.studio.thegraph.com/query/46780/mech/v0.0.1';
    const query = `
      {
        createMeches(first: 10, orderBy: agentId, order: ASC) {
          id
          mech
          agentId
          price
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
        resolve(data.data.createMeches);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export const rpc = {
  100: process.env.NEXT_PUBLIC_GNOSIS_URL,
};
