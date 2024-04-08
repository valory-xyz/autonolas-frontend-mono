// TODO: check all query

/**
 *
 * Helper hook to manage list of items (e.g. components, agents & services)
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import { useSubgraph } from '../../../common-util/hooks/useSubgraph';
import { TOTAL_VIEW_COUNT } from '../../../util/constants';

const serviceColumns = `{
  id
  serviceId
  publicId
  owner
  packageHash
  metadataHash
  state
}`;

/**
 * Searches by
 * - publicId (package name)
 * - description,
 * - serviceId
 * - packageHash
 * - owner
 * @returns  {string} search filter sub query
 */
export const getSearchFilterSubQueryForServices = (searchValue) => {
  return `{ 
    or: [
      { publicId_contains_nocase: "${searchValue}" } 
      { description_contains_nocase: "${searchValue}" }
      { packageHash_contains_nocase: "${searchValue}" }
      { owner_contains_nocase: "${searchValue}" }
    ]
  }`;
};

/**
 * Hook to get ALL units
 * @returns {function} function to get all units
 *
 */
export const useAllServices = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (currentPage) => {
      const query = gql`
        {
          services(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            orderBy: serviceId
          ) ${serviceColumns}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.services || [];
    },
    [graphQlClient],
  );
};

/**
 * Hook to get MY units
 * @returns {function} function to get my units
 */
export const useMyServices = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (ownerAddress, currentPage) => {
      const query = gql`
        {
          services (
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { 
              owner_contains_nocase: "${ownerAddress}"
            },
            orderBy: serviceId,
          ) ${serviceColumns}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.services || [];
    },
    [graphQlClient],
  );
};

/**
 * Hook to get ALL units by search
 * @returns {function} function to get all units by search
 */
export const useAllServicesBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (searchValue, currentPage) => {
      const query = gql`
        {
          services (
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: ${getSearchFilterSubQueryForServices(searchValue)},
            orderBy: serviceId
          ) ${serviceColumns}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.services || [];
    },
    [graphQlClient],
  );
};

/**
 * Hook to get MY units by search
 * @returns {function} function to search units
 */
export const useMyServicesBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (ownerAddress, searchValue, currentPage) => {
      const query = gql`
        {
          services (
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { 
              and: [
                owner_contains_nocase: "${ownerAddress}" 
                ${getSearchFilterSubQueryForServices(searchValue)}
              ]
            }
            orderBy: serviceId,
          ) ${serviceColumns}
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.services || [];
    },
    [graphQlClient],
  );
};

export const useSearchServices = () => {
  const getAllUnitsBySearch = useAllServicesBySearch();
  const getMyServicesBySearch = useMyServicesBySearch();

  return useCallback(
    async (searchValue, currentPage, ownerAddress) => {
      if (ownerAddress) {
        return await getMyServicesBySearch(
          ownerAddress,
          searchValue,
          currentPage,
        );
      }
      return await getAllUnitsBySearch(searchValue, currentPage);
    },
    [getAllUnitsBySearch, getMyServicesBySearch],
  );
};
