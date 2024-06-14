/**
 *
 * Helper hook to manage list of components
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import {
  GRAPHQL_CLIENT,
  UNIT_FIELDS,
  getSearchFilterSubQueryForUnitFields,
} from '../../common-util/hooks/useSubgraph';
import { TOTAL_VIEW_COUNT } from '../../util/constants';

const componentPackageType =
  'packageType_in: [connection,skill,protocol,contract,custom,unknown]';

const getAllAndMyComponentsQuery = (currentPage, ownerAddress = null) => {
  return gql`
    {
      units(
        first: ${TOTAL_VIEW_COUNT}
        skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)}
        where: { 
          ${componentPackageType}
          ${ownerAddress ? `owner_contains_nocase: "${ownerAddress}"` : ''}
        }
        orderBy: tokenId
        orderDirection: desc
      ) ${UNIT_FIELDS}
    }
  `;
};

const getComponentsBySearchQuery = (searchValue, ownerAddress = null) => {
  return gql`
    {
      units(
        where: {
          and: [
            { ${componentPackageType} }
            ${getSearchFilterSubQueryForUnitFields(searchValue)}
            ${
              ownerAddress ? `{ owner_contains_nocase: "${ownerAddress}" }` : ''
            }
          ]
        }
        orderBy: tokenId
        orderDirection: desc
      ) ${UNIT_FIELDS}
    }
  `;
};

/**
 * Hook to get ALL components
 * @returns {function} function to get all units
 *
 */
export const useAllComponents = () => {
  return useCallback(async (currentPage) => {
    const query = getAllAndMyComponentsQuery(currentPage);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * Hook to get MY components
 * @returns {function} function to get my units
 */
export const useMyComponents = () => {
  return useCallback(async (ownerAddress, currentPage) => {
    const query = getAllAndMyComponentsQuery(currentPage, ownerAddress);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * Hook to get ALL components by search
 * @returns {function} function to get all units by search
 */
const useAllComponentsBySearch = () => {
  return useCallback(async (searchValue) => {
    const query = getComponentsBySearchQuery(searchValue);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * Hook to get MY components by search
 * @returns {function} function to search units
 */
const useMyComponentsBySearch = () => {
  return useCallback(async (searchValue, ownerAddress) => {
    const query = getComponentsBySearchQuery(searchValue, ownerAddress);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * @returns {function} function to search units
 */
export const useSearchComponents = () => {
  const getAllComponentsBySearch = useAllComponentsBySearch();
  const getMyComponentsBySearch = useMyComponentsBySearch();

  return useCallback(
    async (searchValue, ownerAddress) => {
      return ownerAddress
        ? await getMyComponentsBySearch(searchValue, ownerAddress)
        : await getAllComponentsBySearch(searchValue);
    },
    [getAllComponentsBySearch, getMyComponentsBySearch],
  );
};
