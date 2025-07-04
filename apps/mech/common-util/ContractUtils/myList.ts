import includes from 'lodash/includes';

import { getFirstAndLastIndex } from 'common-util/functions';
import type { AgentInfo } from 'components/Mechs/utils';

type FilterByOwnerParams = {
  searchValue: string;
  account: string;
};

type Result = {
  id: string;
  owner: string;
  unitHash?: string;
};

export const filterByOwner = (results: Result[], { searchValue, account }: FilterByOwnerParams) =>
  results.filter((e) => {
    const search = (searchValue || '').trim().toLowerCase();
    const owner = (e.owner || '').trim().toLowerCase();
    const hash = (e.unitHash || '').trim().toLowerCase();

    // for "my agents" search only by Account
    if (account) {
      return owner === account.trim().toLowerCase() && includes(hash, search);
    }

    return includes(owner, search) || includes(hash, search);
  });

type GetListByAccountParams = {
  searchValue: string;
  total: number;
  getUnit: (id: string) => { call: () => Promise<unknown> };
  getOwner: (id: number) => Promise<string>;
  account: string;
};
/**
 * get all the list and filter by owner
 */
/** TODO: getUnit is not available on the contract, this needs to be fixed. */
export const getListByAccount = async ({
  searchValue,
  total,
  getUnit,
  getOwner,
  account,
}: GetListByAccountParams): Promise<AgentInfo[]> =>
  new Promise((resolve, reject) => {
    try {
      const allListPromise = [];
      for (let i = 1; i <= total; i += 1) {
        const id = `${i}`;
        const result = getUnit(id).call();
        allListPromise.push(result);
      }

      Promise.all(allListPromise).then(async (componentsList) => {
        const results = await Promise.all(
          componentsList.map(async (info, i) => {
            const id = `${i + 1}`;
            const owner = await getOwner(Number(id));
            return { ...(info as Record<string, unknown>), id, owner };
          }),
        );

        const filteredResults = filterByOwner(results, {
          searchValue,
          account,
        });
        resolve(filteredResults as unknown as AgentInfo[]);
      });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });

type GetMyListOnPaginationParams = {
  total: number;
  nextPage: number;
  list: AgentInfo[];
};

/**
 * call API once and return based on pagination
 */
export const getMyListOnPagination = ({ total, nextPage, list }: GetMyListOnPaginationParams) => {
  const { first, last } = getFirstAndLastIndex(total, nextPage);
  const array = list.slice(first - 1, last);
  return array;
};
