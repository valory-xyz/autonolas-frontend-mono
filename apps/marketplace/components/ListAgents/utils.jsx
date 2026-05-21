import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';

import { TOKENOMICS_UNIT_TYPES } from 'libs/util-constants/src';

import { agentRegistryParams, mechMinterParams } from '../../common-util/Contracts/params';
import { getListByAccount } from '../../common-util/ContractUtils/myList';
import { getFirstAndLastIndex } from '../../common-util/List/functions';
import { wagmiConfig } from '../../common-util/Login/config';
import { requireChainId } from '../../common-util/functions';
import { resolveUnitMetadataUrl } from '../../common-util/functions/tokenUri';

// --------- HELPER METHODS ---------
export const getAgentOwner = async (agentId) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...agentRegistryParams(chainId),
    functionName: 'ownerOf',
    args: [BigInt(agentId)],
  });
};

export const getAgentDetails = async (agentId) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...agentRegistryParams(chainId),
    functionName: 'getUnit',
    args: [BigInt(agentId)],
  });
};

// --------- CONTRACT METHODS ---------
// Coerced to `number` so callers can do arithmetic / pagination math against
// page sizes without TypeErrors from mixing bigint and number.
export const getTotalForAllAgents = async () => {
  const chainId = requireChainId();
  const total = await readContract(wagmiConfig, {
    ...agentRegistryParams(chainId),
    functionName: 'totalSupply',
  });
  return Number(total);
};

export const getTotalForMyAgents = async (account) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...agentRegistryParams(chainId),
    functionName: 'balanceOf',
    args: [account],
  });
};

export const getFilteredAgents = async (searchValue, account) => {
  const chainId = requireChainId();
  const total = await getTotalForAllAgents();
  const list = await getListByAccount({
    searchValue,
    total: Number(total),
    readUnit: (id) =>
      readContract(wagmiConfig, {
        ...agentRegistryParams(chainId),
        functionName: 'getUnit',
        args: [BigInt(id)],
      }),
    getOwner: getAgentOwner,
    account,
  });
  return list;
};

export const getAgents = async (total, nextPage) => {
  const chainId = requireChainId();
  const totalNum = Number(total);

  const allAgentsPromises = [];
  const { first, last } = getFirstAndLastIndex(totalNum, nextPage);
  for (let i = first; i <= last; i += 1) {
    const tokenId = totalNum - (i + first - 1);
    allAgentsPromises.push(
      readContract(wagmiConfig, {
        ...agentRegistryParams(chainId),
        functionName: 'getUnit',
        args: [BigInt(tokenId)],
      }),
    );
  }

  const agents = await Promise.allSettled(allAgentsPromises);
  const results = await Promise.all(
    agents.map(async (info, i) => {
      const id = `${totalNum - (i + first - 1)}`;
      const owner = await getAgentOwner(id);
      return { ...(info.status === 'fulfilled' ? info.value : {}), owner };
    }),
  );

  return results;
};

export const getAgentHashes = async (id) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...agentRegistryParams(chainId),
    functionName: 'getUpdatedHashes',
    args: [BigInt(id)],
  });
};

export const updateAgentHashes = async (account, id, newHash) => {
  const chainId = requireChainId();
  const { request } = await simulateContract(wagmiConfig, {
    ...mechMinterParams(chainId),
    functionName: 'updateHash',
    args: [TOKENOMICS_UNIT_TYPES.AGENT, BigInt(id), `0x${newHash}`],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return null;
};

export const getTokenUri = async (id) => {
  const chainId = requireChainId();
  const updatedHashes = await readContract(wagmiConfig, {
    ...agentRegistryParams(chainId),
    functionName: 'getUpdatedHashes',
    args: [BigInt(id)],
  });
  const unitHashes = updatedHashes?.unitHashes;
  const tokenUri = unitHashes?.length
    ? undefined
    : await readContract(wagmiConfig, {
        ...agentRegistryParams(chainId),
        functionName: 'tokenURI',
        args: [BigInt(id)],
      });
  return resolveUnitMetadataUrl(unitHashes, tokenUri);
};
