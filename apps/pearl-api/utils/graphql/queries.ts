import { gql } from 'graphql-request';

export const getPolymarketBetQuery = gql`
  query GetPolymarketBet($id: ID!) {
    bet(id: $id) {
      id
      transactionHash
      shares
      outcomeIndex
      amount
      question {
        metadata {
          title
          outcomes
        }
        resolution {
          payouts
          settledPrice
          winningIndex
        }
      }
    }
  }
`;
