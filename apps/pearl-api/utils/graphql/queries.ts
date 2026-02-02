import { gql } from 'graphql-request';

export const getPolymarketBetQuery = gql`
  query GetPolymarketBet($id: ID!) {
    bet(id: $id) {
      transactionHash
      outcomeIndex
      amount
      bettor {
        id
      }
      question {
        id
        metadata {
          title
          outcomes
        }
      }
    }
  }
`;

export const getPolymarketMarketParticipantQuery = gql`
  query GetPolymarketMarketParticipant($id: ID!) {
    marketParticipant(id: $id) {
      totalPayout
    }
  }
`;
