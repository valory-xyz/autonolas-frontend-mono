import Web3 from 'web3';
import {
  AGENT_FACTORY_ADDRESS,
  AGENT_FACTORY_ABI,

  AGENT_MECH_ABI,

  AGENT_REGISTRY_ADDRESS,
  AGENT_REGISTRY_ABI,
} from 'common-util/AbiAndAddresses';
import { LOCAL_CHAIN_ID } from 'util/constants';

/**
 * Addresses fetched when backend connected locally
 * to hardhat from initDeploy.json
 */
export const LOCAL_ADDRESSES = {
  OLAS_ADDRESS_LOCAL: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  VEOLAS_ADDRESS_LOCAL: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  BUOLAS_ADDRESS_LOCAL: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
};

export const ADDRESSES = {
  100: {
    agentRegistry: AGENT_REGISTRY_ADDRESS,
    agentFactory: AGENT_FACTORY_ADDRESS,
  },
};

/**
 * Returns contract address based on type and chainId.
 * Right now, only 3 types are supported: olas, veOlas, buOlas
 * and 3 chains: local, goerli and mainnet.
 */
export const getContractAddress = (type, chainId) => {
  switch (type) {
    case 'veOlas': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.VEOLAS_ADDRESS_LOCAL;
      }
      if (chainId === 5) return VEOLAS_ADDRESS_GOERLI;
      return VEOLAS_ADDRESS_MAINNET;
    }
    case 'buOlas': {
      if (chainId === LOCAL_CHAIN_ID) {
        return LOCAL_ADDRESSES.BUOLAS_ADDRESS_LOCAL;
      }
      if (chainId === 5) return BUOLAS_ADDRESS_GOERLI;
      return BUOLAS_ADDRESS_MAINNET;
    }
    case 'olas':
    default: {
      if (chainId === LOCAL_CHAIN_ID) return LOCAL_ADDRESSES.OLAS_ADDRESS_LOCAL;
      if (chainId === 5) return OLAS_ADDRESS_GOERLI;
      return OLAS_ADDRESS_MAINNET;
    }
  }
};

export const getOlasContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? OLAS_ABI_MAINNET : OLAS_ABI_GOERLI,
    getContractAddress('olas', chainId),
  );
  return contract;
};

export const getVeolasContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? VEOLAS_ABI_MAINNET : VEOLAS_ABI_GOERLI,
    getContractAddress('veOlas', chainId),
  );
  return contract;
};

export const getBuolasContract = (p, chainId) => {
  const web3 = new Web3(p);
  const contract = new web3.eth.Contract(
    chainId === 1 ? BUOLAS_ABI_MAINNET : BUOLAS_ABI_GOERLI,
    getContractAddress('buOlas', chainId),
  );
  return contract;
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
  const { web3, address , chainId } = getWeb3Details();
  const { agentRegistry } = address.agentRegistry;
  console.log("Web3 Details:" + AGENT_REGISTRY_ADDRESS);
  const contract = new web3.eth.Contract(
    AGENT_REGISTRY_ABI,
    AGENT_REGISTRY_ADDRESS,
  );
  return contract;
};


// export async function fetchGraphQLData() {
//   const url = "https://api.studio.thegraph.com/query/46780/mech/v0.0.1";
//   const query = `
//     {
//       createMeches(first: 10) {
//         id
//         mech
//         agentId
//         price
//       }
//     }
//   `;

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ query }),
//   });

//   if (response.ok) {
//     const data = await response.json();
//     console.log(data.data.createMeches);
//     return data.data.createMeches;
//   } else {
//     console.error("Error fetching data:", response.statusText);
//   }
// }

export async function fetchGraphQLData() {
  return new Promise((resolve, reject) => {
    const url = "https://api.studio.thegraph.com/query/46780/mech/v0.0.1";
    const query = `
      {
        createMeches(first: 10) {
          id
          mech
          agentId
          price
        }
      }
    `;

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Error fetching data: " + response.statusText);
        }
      })
      .then((data) => {
        resolve(data.data.createMeches);
      })
      .catch((error) => {
        reject(error);
      });
  });
}