/**
 *
 * Helper hook to manage list of agents
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import {
  useSubgraph,
  columnsForAgentsAndComponents,
  getSearchFilterSubQueryForAgentsAndComponents,
} from '../../common-util/hooks/useSubgraph';
import { TOTAL_VIEW_COUNT } from '../../util/constants';

/**
 * Hook to get ALL units
 * @returns {function} function to get all units
 *
 */
export const useAllAgents = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { packageType: agent }, 
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
 * Hook to get MY units
 * @returns {function} function to get my units
 */
export const useMyAgents = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (ownerAddress, currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { 
              packageType: agent
              owner_contains_nocase: "${ownerAddress}", 
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
 * Hook to get ALL units by search
 * @returns {function} function to get all units by search
 */
const useAllAgentsBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (searchValue) => {
      const query = gql`
        {
          units(
            where: {
              and: [
                { packageType: "agent" }
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
 * Hook to get MY units by search
 * @returns {function} function to search units
 */
const useMyAgentsBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (ownerAddress, searchValue) => {
      const query = gql`
        {
          units(
            where: {
              and: [
                { packageType: "agent" }
                { owner_contains_nocase: "${ownerAddress}" }
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
 * @returns {function} function to search units
 */
export const useSearchAgents = () => {
  const getAllAgentsBySearch = useAllAgentsBySearch();
  const getMyAgentsBySearch = useMyAgentsBySearch();

  return useCallback(
    async (searchValue, ownerAddress) => {
      if (ownerAddress) {
        return await getMyAgentsBySearch(ownerAddress, searchValue);
      }
      return await getAllAgentsBySearch(searchValue);
    },
    [getAllAgentsBySearch, getMyAgentsBySearch],
  );
};
