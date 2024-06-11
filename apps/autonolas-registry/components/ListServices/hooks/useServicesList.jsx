/**
 *
 * Helper hook to manage list of items (e.g. components, agents & services)
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import { GRAPHQL_CLIENT } from '../../../common-util/hooks/useSubgraph';
import { HASH_PREFIX, TOTAL_VIEW_COUNT } from '../../../util/constants';

const SERVICE_FIELDS = `{
  id
  serviceId
  publicId
  owner
  packageHash
  metadataHash
  state
  description
}`;

const getAllAndMyServicesQuery = (currentPage, ownerAddress = null) => {
  return gql`
    {
      services(
        first: ${TOTAL_VIEW_COUNT}, 
        skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
        orderBy: serviceId
        orderDirection: desc
        ${
          ownerAddress
            ? `where: { owner_contains_nocase: "${ownerAddress}" }`
            : ''
        }
      ) ${SERVICE_FIELDS}
    }
  `;
};

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
  const completeMetadataHash = searchValue.replace(/0x/g, HASH_PREFIX);
  return `{ 
    or: [
      { publicId_contains_nocase: "${searchValue}" } 
      { packageHash_contains_nocase: "${searchValue}" }
      { owner_contains_nocase: "${searchValue}" }
      { metadataHash_contains_nocase: "${completeMetadataHash}" }
      { description_contains_nocase: "${searchValue}" }
    ]
  }`;
};

const getServicesBySearchQuery = (
  searchValue,
  currentPage,
  ownerAddress = null,
) => {
  return gql`
    {
      services (
        first: ${TOTAL_VIEW_COUNT}, 
        skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
        where: {
          and: [
            ${
              ownerAddress ? `{ owner_contains_nocase: "${ownerAddress}" }` : ''
            }
            ${getSearchFilterSubQueryForServices(searchValue)},
          ]
        }
        orderBy: serviceId
        orderDirection: desc
      ) ${SERVICE_FIELDS}
    }
  `;
};

/**
 * Hook to get ALL units
 * @returns {function} function to get all units
 *
 */
export const useAllServices = () => {
  return useCallback(async (currentPage) => {
    const query = getAllAndMyServicesQuery(currentPage);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.services || [];
  }, []);
};

/**
 * Hook to get MY units
 * @returns {function} function to get my units
 */
export const useMyServices = () => {
  return useCallback(async (ownerAddress, currentPage) => {
    const query = getAllAndMyServicesQuery(currentPage, ownerAddress);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.services || [];
  }, []);
};

/**
 * Hook to get ALL units by search
 * @returns {function} function to get all units by search
 */
export const useAllServicesBySearch = () => {
  return useCallback(async (searchValue, currentPage) => {
    const query = getServicesBySearchQuery(searchValue, currentPage);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.services || [];
  }, []);
};

/**
 * Hook to get MY units by search
 * @returns {function} function to search units
 */
export const useMyServicesBySearch = () => {
  return useCallback(async (searchValue, currentPage, ownerAddress) => {
    const query = getServicesBySearchQuery(
      searchValue,
      currentPage,
      ownerAddress,
    );
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.services || [];
  }, []);
};

export const useSearchServices = () => {
  const getAllUnitsBySearch = useAllServicesBySearch();
  const getMyServicesBySearch = useMyServicesBySearch();

  return useCallback(
    async (searchValue, currentPage, ownerAddress) => {
      return ownerAddress
        ? await getMyServicesBySearch(searchValue, currentPage, ownerAddress)
        : await getAllUnitsBySearch(searchValue, currentPage);
    },
    [getAllUnitsBySearch, getMyServicesBySearch],
  );
};
