import { gql } from 'graphql-request';

// Squid (OpenReader) dialect. Selects every bet of the participant in that market so the
// requested buy's share of the payout can be computed.
export const getPolymarketDataQuery = gql`
  query GetPolymarketData($id: String!) {
    betById(id: $id) {
      id
      outcomeIndex
      transactionHash
      question {
        metadata {
          title
        }
        resolution {
          winningIndex
        }
      }
      marketParticipant {
        totalPayout
        bets(orderBy: blockTimestamp_ASC, limit: 1000) {
          id
          outcomeIndex
          amount
          shares
          isBuy
          blockTimestamp
        }
      }
    }
  }
`;

export const getOmenBetDataQuery = gql`
  query GetOmenBetData($id: ID!) {
    marketParticipants(where: { bets_: { id: $id } }) {
      totalPayout
      fixedProductMarketMaker {
        id
        question
        outcomes
        currentAnswer
        currentAnswerTimestamp
        answerFinalizedTimestamp
        isPendingArbitration
      }
      bets(first: 1000, orderBy: timestamp, orderDirection: asc) {
        id
        outcomeIndex
        amount
        outcomeTokenAmount
        transactionHash
        blockTimestamp
      }
    }
  }
`;
