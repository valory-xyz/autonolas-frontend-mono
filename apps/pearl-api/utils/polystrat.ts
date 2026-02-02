import { getPolymarketBetQuery, getPolymarketMarketParticipantQuery } from './graphql/queries';
import { PREDICT_POLYMARKET_CLIENT } from './graphql/client';
import { PolymarketBetData } from 'types';

const USDC_DECIMALS = 6;

type PolymarketBetResponse = {
  bet: {
    transactionHash: string;
    outcomeIndex: string;
    amount: string;
    bettor: {
      id: string;
    };
    question: {
      id: string;
      metadata: {
        title: string;
        outcomes: string[];
      };
    };
  } | null;
};

type MarketParticipantResponse = {
  marketParticipant: {
    totalPayout: string;
  } | null;
};

const transformPolymarketBet = (
  betResponse: PolymarketBetResponse,
  participantResponse: MarketParticipantResponse,
): PolymarketBetData | null => {
  if (!betResponse?.bet || !participantResponse?.marketParticipant) return null;

  const { bet } = betResponse;
  const { question, amount, transactionHash } = bet;
  const outcomeIndex = parseInt(bet.outcomeIndex);
  const position = question.metadata.outcomes[outcomeIndex];

  const betAmount = parseFloat(amount) / Math.pow(10, USDC_DECIMALS);
  const amountWon =
    parseFloat(participantResponse.marketParticipant.totalPayout) / Math.pow(10, USDC_DECIMALS);

  return {
    question: question.metadata.title,
    position,
    transactionHash,
    betAmount,
    amountWon,
    betAmountFormatted: `$${betAmount.toFixed(2)}`,
    amountWonFormatted: `$${amountWon.toFixed(2)}`,
    multiplier: amountWon > 0 ? (amountWon / betAmount).toFixed(2) : '0.00',
  };
};

export const getPolymarketBet = async (id: string) => {
  if (!process.env.POLYMARKET_SUBGRAPH_API_KEY) {
    throw new Error('POLYMARKET_SUBGRAPH_API_KEY not found');
  }

  const headers = {
    Authorization: `Bearer ${process.env.POLYMARKET_SUBGRAPH_API_KEY}`,
  };
  const betData = await PREDICT_POLYMARKET_CLIENT.request<PolymarketBetResponse>(
    getPolymarketBetQuery,
    { id },
    headers,
  );

  if (!betData?.bet) return null;

  const marketParticipantId = `${betData.bet.bettor.id}_${betData.bet.question.id}`;
  const marketParticipantData = await PREDICT_POLYMARKET_CLIENT.request<MarketParticipantResponse>(
    getPolymarketMarketParticipantQuery,
    { id: marketParticipantId },
    headers,
  );

  return transformPolymarketBet(betData, marketParticipantData);
};
