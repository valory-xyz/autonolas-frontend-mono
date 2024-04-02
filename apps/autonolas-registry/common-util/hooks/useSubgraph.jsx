import { GraphQLClient } from 'graphql-request';

export const useSubgraph = () => {
  const graphQLClient = new GraphQLClient(
    process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL,
    {
      method: 'POST',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    },
  );

  return graphQLClient;
};
