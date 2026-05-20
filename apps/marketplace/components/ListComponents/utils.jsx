import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';

import { TOKENOMICS_UNIT_TYPES } from 'libs/util-constants/src';

import { componentRegistryParams, mechMinterParams } from 'common-util/Contracts/params';
import { getListByAccount } from 'common-util/ContractUtils/myList';
import { getFirstAndLastIndex } from 'common-util/List/functions';
import { wagmiConfig } from 'common-util/Login/config';
import { getChainId } from 'common-util/functions';
import { resolveUnitMetadataUrl } from 'common-util/functions/tokenUri';

const requireChainId = () => {
  const chainId = getChainId();
  if (chainId instanceof Error) throw chainId;
  if (chainId === undefined || chainId === null) throw new Error('Cannot determine chain ID');
  return chainId;
};

// --------- HELPER METHODS ---------
export const getComponentOwner = async (id) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...componentRegistryParams(chainId),
    functionName: 'ownerOf',
    args: [BigInt(id)],
  });
};

export const getComponentDetails = async (id) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...componentRegistryParams(chainId),
    functionName: 'getUnit',
    args: [BigInt(id)],
  });
};

// --------- CONTRACT METHODS ---------
export const getTotalForAllComponents = async () => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...componentRegistryParams(chainId),
    functionName: 'totalSupply',
  });
};

export const getTotalForMyComponents = async (account) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...componentRegistryParams(chainId),
    functionName: 'balanceOf',
    args: [account],
  });
};

export const getFilteredComponents = async (searchValue, account) => {
  const chainId = requireChainId();
  const total = await getTotalForAllComponents();
  const list = await getListByAccount({
    searchValue,
    total: Number(total),
    readUnit: (id) =>
      readContract(wagmiConfig, {
        ...componentRegistryParams(chainId),
        functionName: 'getUnit',
        args: [BigInt(id)],
      }),
    getOwner: getComponentOwner,
    account,
  });
  return list;
};

export const getComponents = async (total, nextPage) => {
  const chainId = requireChainId();
  const totalNum = Number(total);

  const allComponentsPromises = [];
  const { first, last } = getFirstAndLastIndex(totalNum, nextPage);
  for (let i = first; i <= last; i += 1) {
    const tokenId = totalNum - (i + first - 1);
    allComponentsPromises.push(
      readContract(wagmiConfig, {
        ...componentRegistryParams(chainId),
        functionName: 'getUnit',
        args: [BigInt(tokenId)],
      }),
    );
  }

  const components = await Promise.allSettled(allComponentsPromises);
  const results = await Promise.all(
    components.map(async (info, i) => {
      const id = `${totalNum - (i + first - 1)}`;
      const owner = await getComponentOwner(id);
      return { ...(info.status === 'fulfilled' ? info.value : {}), owner };
    }),
  );

  return results;
};

export const getComponentHashes = async (id) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...componentRegistryParams(chainId),
    functionName: 'getUpdatedHashes',
    args: [BigInt(id)],
  });
};

export const updateComponentHashes = async (account, id, newHash) => {
  const chainId = requireChainId();
  const { request } = await simulateContract(wagmiConfig, {
    ...mechMinterParams(chainId),
    functionName: 'updateHash',
    args: [TOKENOMICS_UNIT_TYPES.COMPONENT, BigInt(id), `0x${newHash}`],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return null;
};

export const getTokenUri = async (id) => {
  const chainId = requireChainId();
  const updatedHashes = await readContract(wagmiConfig, {
    ...componentRegistryParams(chainId),
    functionName: 'getUpdatedHashes',
    args: [BigInt(id)],
  });
  const unitHashes = updatedHashes?.unitHashes;
  const tokenUri = unitHashes?.length
    ? undefined
    : await readContract(wagmiConfig, {
        ...componentRegistryParams(chainId),
        functionName: 'tokenURI',
        args: [BigInt(id)],
      });
  return resolveUnitMetadataUrl(unitHashes, tokenUri);
};
