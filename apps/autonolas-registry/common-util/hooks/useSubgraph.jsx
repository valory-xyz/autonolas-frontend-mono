import { useMemo } from 'react';
import { GraphQLClient } from 'graphql-request';

export const useSubgraph = () => {
  const graphQlClient = useMemo(
    () => new GraphQLClient(
      process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL,
      {
        method: 'POST',
        jsonSerializer: {
          parse: JSON.parse,
          stringify: JSON.stringify,
        },
      },
    ),
    []
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
  return `{ 
    or: [
      { publicId_contains_nocase: "${searchValue}" } 
      { description_contains_nocase: "${searchValue}" }
      { packageHash_contains_nocase: "${searchValue}" }
      { owner_contains_nocase: "${searchValue}" }
    ]
  }`;
};
