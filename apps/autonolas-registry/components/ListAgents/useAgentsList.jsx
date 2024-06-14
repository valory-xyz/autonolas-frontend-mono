/**
 *
 * Helper hook to manage list of agents
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import {
  GRAPHQL_CLIENT,
  UNIT_FIELDS,
  getSearchFilterSubQueryForUnitFields,
} from '../../common-util/hooks/useSubgraph';
import { TOTAL_VIEW_COUNT } from '../../util/constants';

const getAllAndMyAgentsQuery = (currentPage, ownerAddress = null) => {
  return gql`
    {
      units(
        first: ${TOTAL_VIEW_COUNT}
        skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)}
        where: { 
          packageType: agent 
          ${ownerAddress ? `owner_contains_nocase: "${ownerAddress}"` : ''}
        },
        orderBy: tokenId
        orderDirection: desc
      ) ${UNIT_FIELDS}
    }
  `;
};

const getAgentsBySearchQuery = (searchValue, ownerAddress = null) => {
  return gql`
    {
      units(
        where: {
          and: [
            { packageType: "agent" }
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
 * Hook to get ALL units
 * @returns {function} function to get all units
 *
 */
export const useAllAgents = () => {
  return useCallback(async (currentPage) => {
    const query = getAllAndMyAgentsQuery(currentPage);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * Hook to get MY units
 * @returns {function} function to get my units
 */
export const useMyAgents = () => {
  return useCallback(async (ownerAddress, currentPage) => {
    const query = getAllAndMyAgentsQuery(currentPage, ownerAddress);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * Hook to get ALL units by search
 * @returns {function} function to get all units by search
 */
const useAllAgentsBySearch = () => {
  return useCallback(async (searchValue) => {
    const query = getAgentsBySearchQuery(searchValue);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * Hook to get MY units by search
 * @returns {function} function to search units
 */
const useMyAgentsBySearch = () => {
  return useCallback(async (searchValue, ownerAddress) => {
    const query = getAgentsBySearchQuery(searchValue, ownerAddress);
    const response = await GRAPHQL_CLIENT.request(query);
    return response?.units;
  }, []);
};

/**
 * @returns {function} function to search units
 */
export const useSearchAgents = () => {
  const getAllAgentsBySearch = useAllAgentsBySearch();
  const getMyAgentsBySearch = useMyAgentsBySearch();

  return useCallback(
    async (searchValue, ownerAddress) => {
      return ownerAddress
        ? await getMyAgentsBySearch(searchValue, ownerAddress)
        : await getAllAgentsBySearch(searchValue);
    },
    [getAllAgentsBySearch, getMyAgentsBySearch],
  );
};
