import { Contract } from 'web3-eth-contract';

import { getAgentContract, getServiceContract } from 'common-util/Contracts';

/**
 *
 * @param address Mech contract address
 * @returns either agent's ID (for legacy mechs) or service Id
 */
export const getTokenId = (contract: Contract) =>
  new Promise<string>((resolve, reject) => {
    contract.methods
      .tokenId()
      .call()
      .then((response: string) => {
        resolve(response);
      })
      .catch((e: typeof Error) => {
        console.error(e);
        reject(e);
      });
  });

export const getAgentHashes = (id: string) =>
  new Promise<{ agentHashes: string[] }>((resolve, reject) => {
    const contract = getAgentContract();

    contract.methods
      .getHashes(id)
      .call()
      .then((response: { agentHashes: string[] }) => {
        resolve(response);
      })
      .catch((e: typeof Error) => {
        console.error(e);
        reject(e);
      });
  });

// export const getAgentId = (serviceId: string) =>
//   new Promise<string | null>((resolve, reject) => {
//     const contract = getServiceContract();

//     contract.methods
//       .getService(serviceId)
//       .call()
//       .then((response: { agentIds: string[] }) => {
//         const agentId = response.agentIds[0];
//         if (!agentId) resolve(null);

//         resolve(agentId);
//       })
//       .catch((e: typeof Error) => {
//         console.error(e);
//         reject(e);
//       });
//   });
