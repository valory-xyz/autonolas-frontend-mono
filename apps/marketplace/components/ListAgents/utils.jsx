import { TOKENOMICS_UNIT_TYPES } from 'libs/util-constants/src';

import { getListByAccount } from '../../common-util/ContractUtils/myList';
import { getAgentContract, getMechMinterContract } from '../../common-util/Contracts';
import { getFirstAndLastIndex } from '../../common-util/List/functions';
import { sendTransaction } from '../../common-util/functions';
import { GATEWAY_URL, HASH_PREFIX } from 'util/constants';

// --------- HELPER METHODS ---------
export const getAgentOwner = async (agentId) => {
  const contract = getAgentContract();
  const owner = await contract.methods.ownerOf(agentId).call();
  return owner;
};

export const getAgentDetails = async (agentId) => {
  const contract = getAgentContract();
  const response = await contract.methods.getUnit(agentId).call();
  return response;
};

// --------- CONTRACT METHODS ---------
export const getTotalForAllAgents = async () => {
  const contract = getAgentContract();
  const total = await contract.methods.totalSupply().call();
  return total;
};

export const getTotalForMyAgents = async (account) => {
  const contract = getAgentContract();
  const total = await contract.methods.balanceOf(account).call();
  return total;
};

export const getFilteredAgents = async (searchValue, account) => {
  const contract = getAgentContract();
  const total = await getTotalForAllAgents();
  const list = await getListByAccount({
    searchValue,
    total,
    getUnit: contract.methods.getUnit,
    getOwner: getAgentOwner,
    account,
  });
  return list;
};

export const getAgents = async (total, nextPage) => {
  const contract = getAgentContract();

  const allAgentsPromises = [];
  const { first, last } = getFirstAndLastIndex(total, nextPage);
  for (let i = first; i <= last; i += 1) {
    allAgentsPromises.push(contract.methods.getUnit(`${total - (i + first - 1)}`).call());
  }

  const agents = await Promise.allSettled(allAgentsPromises);
  const results = await Promise.all(
    agents.map(async (info, i) => {
      const owner = await getAgentOwner(`${total - (i + first - 1)}`);
      return { ...info.value, owner };
    }),
  );

  return results;
};

export const getAgentHashes = async (id) => {
  const contract = getAgentContract();
  const response = await contract.methods.getUpdatedHashes(id).call();
  return response;
};

export const updateAgentHashes = async (account, id, newHash) => {
  const contract = getMechMinterContract();

  const fn = contract.methods.updateHash(TOKENOMICS_UNIT_TYPES.AGENT, id, `0x${newHash}`).send({
    from: account,
  });
  await sendTransaction(fn, account);
  return null;
};

export const getTokenUri = async (id) => {
  const contract = getAgentContract();

  const updatedHashes = await contract.methods.getUpdatedHashes(id).call();
  const unitHashes = updatedHashes.unitHashes;

  if (unitHashes.length > 0) {
    // return the last updated hash if there are `updatedHashes`
    return `${GATEWAY_URL}${unitHashes[unitHashes.length - 1].replace('0x', HASH_PREFIX)}`;
  } else {
    // return initial hash if there are no updatedHashes
    return await contract.methods.tokenURI(id).call();
  }
};
