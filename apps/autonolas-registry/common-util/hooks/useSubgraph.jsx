import { useMemo } from 'react';
import { GraphQLClient } from 'graphql-request';
import { HASH_PREFIX } from '../../util/constants';

export const useSubgraph = () => {
  const graphQlClient = useMemo(
    () =>
      new GraphQLClient(process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL, {
        method: 'POST',
        jsonSerializer: {
          parse: JSON.parse,
          stringify: JSON.stringify,
        },
      }),
    [],
  );

  return graphQlClient;
};

export const columnsForAgentsAndComponents = `{
  id
  tokenId
  owner
  publicId
  packageHash
  metadataHash
}`;

/**
 * Searches by
 * - publicId (package name)
 * - description,
 * - tokenId
 * - packageHash
 * - owner
 * @returns  {string} search filter sub query
 */
export const getSearchFilterSubQueryForAgentsAndComponents = (searchValue) => {
  const completeMetadataHash = searchValue.replace(/0x/g, HASH_PREFIX);
  return `{ 
    or: [
      { publicId_contains_nocase: "${searchValue}" } 
      { description_contains_nocase: "${searchValue}" }
      { packageHash_contains_nocase: "${searchValue}" }
      { owner_contains_nocase: "${searchValue}" }
      { metadataHash_contains_nocase: "${completeMetadataHash}" }
    ]
  }`;
};
