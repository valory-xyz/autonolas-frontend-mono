import { GraphQLClient } from 'graphql-request';

const predictPolymarketUrl = process.env.NEXT_PUBLIC_PREDICT_POLYMARKET_URL;

if (!predictPolymarketUrl) {
  throw new Error('Environment variable NEXT_PUBLIC_PREDICT_POLYMARKET_URL is not set.');
}

export const PREDICT_POLYMARKET_CLIENT = new GraphQLClient(predictPolymarketUrl);
