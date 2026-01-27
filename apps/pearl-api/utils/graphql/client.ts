import { GraphQLClient } from 'graphql-request';

export const PREDICT_POLYMARKET_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_PREDICT_POLYMARKET_URL!,
);
