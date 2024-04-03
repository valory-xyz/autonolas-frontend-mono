// TODO: check all query

/**
 *
 * Helper hook to manage list of items (e.g. components, agents & services)
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import { useSubgraph } from './useSubgraph';
import dummyData from './mock.json';
import { TOTAL_VIEW_COUNT } from '../../util/constants';

const transformToTableData = (data) => {
  return data.map((item) => ({
    id: item.tokenId,
    owner: item.owner,
    unitHash: item.metadataHash,
  }));
};

/**
 * Hook to get ALL units
 * @returns {function} function to get all units
 *
 */
export const useAllUnits = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (type, currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { packageType: "${type}" }, 
            orderBy: tokenId
          ) {
              id
              packageType
              tokenId
              packageHash
              metadataHash
          }
        }
      `;

      const response = await graphQlClient.request(query);
      return transformToTableData(response?.units?.das || dummyData.data.units); // TODO: remove dummyData
    },
    [graphQlClient],
  );
};

/**
 * Hook to get ALL units by search
 * @returns {function} function to get all units by search
 */
export const useAllUnitsBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (type, searchValue, currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            OR: [
              { 
                packageType: "${type}", 
                name_contains: "${searchValue}" 
              },
              { 
                packageType: "${type}", 
                packageHash_contains: "${searchValue}" 
              }
            ],
            orderBy: tokenId
          ) {
              id
              packageType
              tokenId
              packageHash
              metadataHash
          }
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.units || dummyData.data.units; // TODO: remove dummyData
    },
    [graphQlClient],
  );
};

/**
 * Hook to get MY units
 * @returns {function} function to get my units
 */
export const useMyUnits = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (type, ownerAddress, currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { 
              owner: "${ownerAddress}", 
              packageType: "${type}" 
            },
            orderBy: tokenId,
          ) {
              id
              packageType
              tokenId
              packageHash
              metadataHash
          }
        }
      `;

      const response = await graphQlClient.request(query);
      const units = response?.units || dummyData.data.units; // TODO: remove dummyData
      return units;
    },
    [graphQlClient],
  );
};

/**
 * Hook to get MY units by search
 * @returns {function} function to search units
 */
export const useMyUnitsBySearch = () => {
  const graphQlClient = useSubgraph();

  return useCallback(
    async (type, ownerAddress, searchValue, currentPage) => {
      const query = gql`
        {
          units(
            first: ${TOTAL_VIEW_COUNT}, 
            skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
            where: { owner: "${ownerAddress}" }
            OR: [
              { 
                packageType: "${type}", 
                name_contains: "${searchValue}" 
              },
              { 
                packageType: "${type}", 
                packageHash_contains: "${searchValue}" 
              }
            ],
            orderBy: tokenId,
          ) {
              id
              packageType
              tokenId
              packageHash
              metadataHash
          }
        }
      `;

      const response = await graphQlClient.request(query);
      return response?.units || dummyData.data.units; // TODO: remove dummyData
    },
    [graphQlClient],
  );
};

export const useSearchUnits = () => {
  const getAllUnitsBySearch = useAllUnitsBySearch();
  const getMyUnitsBySearch = useMyUnitsBySearch();

  return useCallback(
    async (type, searchValue, currentPage, ownerAddress) => {
      if (ownerAddress) {
        return await getMyUnitsBySearch(
          type,
          ownerAddress,
          searchValue,
          currentPage,
        );
      }
      return await getAllUnitsBySearch(type, searchValue, currentPage);
    },
    [getAllUnitsBySearch, getMyUnitsBySearch],
  );
};
