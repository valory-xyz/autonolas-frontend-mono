import { getPolymarketDataQuery } from './graphql/queries';
import { PREDICT_POLYMARKET_CLIENT } from './graphql/client';
import { PolymarketBetData } from 'types';

const USDC_DECIMALS = 6;

type PolymarketDataResponse = {
  marketParticipants: Array<{
    totalPayout: string;
    bets: Array<{
      transactionHash: string;
      outcomeIndex: string;
      amount: string;
      bettor: {
        id: string;
      };
    }>;
    question: {
      metadata: {
        title: string;
        outcomes: string[];
      } | null;
    } | null;
  }>;
};

const OUTCOMES = ['Yes', 'No'];

const transformPolymarketData = (response: PolymarketDataResponse): PolymarketBetData | null => {
  const participant = response.marketParticipants[0];
  if (!participant) return null;

  const bet = participant.bets[0];
  if (!bet) return null;

  const { question, totalPayout } = participant;
  const { amount, transactionHash, outcomeIndex } = bet;
  const parsedOutcomeIndex = parseInt(outcomeIndex);

  const title = question?.metadata?.title ?? 'N/A';
  const position = OUTCOMES[parsedOutcomeIndex] ?? 'N/A';

  const betAmount = parseFloat(amount) / Math.pow(10, USDC_DECIMALS);
  const amountWon = parseFloat(totalPayout) / Math.pow(10, USDC_DECIMALS);

  return {
    question: title,
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
  const data = await PREDICT_POLYMARKET_CLIENT.request<PolymarketDataResponse>(
    getPolymarketDataQuery,
    { id },
  );

  return transformPolymarketData(data);
};
