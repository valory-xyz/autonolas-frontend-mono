/**
 *
 * Helper hook to manage list of components
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import {
  useSubgraph,
  columnsForAgentsAndComponents,
  getSearchFilterSubQueryForAgentsAndComponents,
} from '../../common-util/hooks/useSubgraph';
import { TOTAL_VIEW_COUNT } from '../../util/constants';

const componentPackageType =
  'packageType_in: [connection,skill,protocol,contract]';

/**
 * Hook to get ALL components
 * @returns {function} function to get all units
 *
 */
export const useAllComponents = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { ${componentPackageType} }, 
            orderBy: tokenId
          ) ${columnsForAgentsAndComponents}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.units;
    },
    [graphQlClient],
  );
};

/**
 * Hook to get MY components
 * @returns {function} function to get my units
 */
export const useMyComponents = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (ownerAddress, currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { 
              owner: "${ownerAddress}", 
              ${componentPackageType}
            },
            orderBy: tokenId,
          ) ${columnsForAgentsAndComponents}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.units;
    },
    [graphQlClient],
  );
};

/**
 * Hook to get ALL components by search
 * @returns {function} function to get all units by search
 */
const useAllComponentsBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (searchValue) => {
      const query = gql`
        {
          units(
            where: {
              and: [
                { ${componentPackageType} }
                ${getSearchFilterSubQueryForAgentsAndComponents(searchValue)}
              ]
            }
            orderBy: tokenId
          ) ${columnsForAgentsAndComponents}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.units;
    },
    [graphQlClient],
  );
};

/**
 * Hook to get MY components by search
 * @returns {function} function to search units
 */
const useMyComponentsBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (ownerAddress, searchValue) => {
      const query = gql`
        {
          units(
            where: {
              and: [
                { ${componentPackageType} }
                { owner_contains_nocase: "${ownerAddress}" }
                { 
                  or: [
                    { publicId_contains_nocase: "${searchValue}" }
                    { packageHash_contains_nocase: "${searchValue}" }
                  ]
                }
              ]
            }
            orderBy: tokenId
          ) ${columnsForAgentsAndComponents}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.units;
    },
    [graphQlClient],
  );
};

/**
 * @returns {function} function to search units
 */
export const useSearchComponents = () => {
  const getAllComponentsBySearch = useAllComponentsBySearch();
  const getMyComponentsBySearch = useMyComponentsBySearch();

  return useCallback(
    async (searchValue, ownerAddress) => {
      if (ownerAddress) {
        return await getMyComponentsBySearch(ownerAddress, searchValue);
      }
      return await getAllComponentsBySearch(searchValue);
    },
    [getAllComponentsBySearch, getMyComponentsBySearch],
  );
};
