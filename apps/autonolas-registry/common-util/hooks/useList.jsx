/**
 * Helper hook to manage list of items (e.g. components, agents & services)
 */

import { useCallback } from 'react';
import { gql } from 'graphql-request';

import { useSubgraph } from './useSubgraph';
import dummyData from './mock.json';
import { TOTAL_VIEW_COUNT } from '../../util/constants';

export const useListAllUnits = () => {
  const graphQLClient = useSubgraph();

  const getUnits = useCallback(
    async (type, currentPage) => {
      try {
        // TODO: check query
        const query = gql`
          {
            units(
              first: ${TOTAL_VIEW_COUNT}, 
              skip: ${TOTAL_VIEW_COUNT * (currentPage - 1)},
              where: { packageType: "${type}" }, orderBy: tokenId
            ) {
                id
                packageType
                tokenId
                packageHash
                metadataHash
            }
          }
        `;

        const response = await graphQLClient.request(query);
        const units = response?.units || dummyData.data.units; // TODO: remove dummyData
        return units;
      } catch (error) {
        console.error(error);
      }
    },
    [graphQLClient],
  );

  const getFilteredUnits = useCallback(
    async (type, searchValue, currentPage) => {
      try {
        // TODO: check query & search name, description, public id, token id, package hash
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

        const response = await graphQLClient.request(query);
        const units = response?.units || dummyData.data.units; // TODO: remove dummyData
        return units;
      } catch (error) {
        console.error(error);
      }
    },
    [graphQLClient],
  );

  return {
    getUnits,
    getFilteredUnits,
  };
};
