import { TOKENOMICS_UNIT_TYPES } from 'libs/util-constants/src';

import { getListByAccount } from 'common-util/ContractUtils/myList';
import { getComponentContract, getMechMinterContract } from 'common-util/Contracts';
import { getFirstAndLastIndex } from 'common-util/List/functions';
import { resolveUnitMetadataUrl } from 'common-util/functions/tokenUri';
import { sendTransaction } from 'common-util/functions';

// --------- HELPER METHODS ---------
export const getComponentOwner = async (id) => {
  const contract = getComponentContract();
  const owner = await contract.methods.ownerOf(id).call();
  return owner;
};

export const getComponentDetails = async (id) => {
  const contract = getComponentContract();
  const response = await contract.methods.getUnit(id).call();
  return response;
};

// --------- CONTRACT METHODS ---------
export const getTotalForAllComponents = async () => {
  const contract = getComponentContract();
  const total = await contract.methods.totalSupply().call();
  return total;
};

export const getTotalForMyComponents = async (account) => {
  const contract = getComponentContract();
  const balance = await contract.methods.balanceOf(account).call();
  return balance;
};

export const getFilteredComponents = async (searchValue, account) => {
  const contract = getComponentContract();
  const total = await getTotalForAllComponents();
  const list = await getListByAccount({
    searchValue,
    total,
    getUnit: contract.methods.getUnit,
    getOwner: getComponentOwner,
    account,
  });
  return list;
};

export const getComponents = async (total, nextPage) => {
  const contract = getComponentContract();

  const allComponentsPromises = [];
  const { first, last } = getFirstAndLastIndex(total, nextPage);
  for (let i = first; i <= last; i += 1) {
    allComponentsPromises.push(contract.methods.getUnit(`${total - (i + first - 1)}`).call());
  }

  const components = await Promise.allSettled(allComponentsPromises);
  const results = await Promise.all(
    components.map(async (info, i) => {
      const owner = await getComponentOwner(`${total - (i + first - 1)}`);
      return { ...info.value, owner };
    }),
  );

  return results;
};

export const getComponentHashes = async (id) => {
  const contract = getComponentContract();
  const response = await contract.methods.getUpdatedHashes(id).call();
  return response;
};

export const updateComponentHashes = async (account, id, newHash) => {
  const contract = getMechMinterContract();

  const fn = contract.methods.updateHash(TOKENOMICS_UNIT_TYPES.COMPONENT, id, `0x${newHash}`).send({
    from: account,
  });
  await sendTransaction(fn, account);
  return null;
};

export const getTokenUri = async (id) => {
  const contract = getComponentContract();
  const updatedHashes = await contract.methods.getUpdatedHashes(id).call();
  const unitHashes = updatedHashes.unitHashes;
  const tokenUri = unitHashes?.length ? undefined : await contract.methods.tokenURI(id).call();
  return resolveUnitMetadataUrl(unitHashes, tokenUri);
};
