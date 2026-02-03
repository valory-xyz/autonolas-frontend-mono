import { gql } from 'graphql-request';

export const getPolymarketDataQuery = gql`
  query GetPolymarketData($id: String!) {
    marketParticipants(where: { bets_: { id: $id } }) {
      totalPayout
      bets(where: { id: $id }) {
        transactionHash
        outcomeIndex
        amount
        bettor {
          id
        }
      }
      question {
        metadata {
          title
          outcomes
        }
      }
    }
  }
`;
