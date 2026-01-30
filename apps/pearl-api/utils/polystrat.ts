import { getPolymarketBetQuery } from './graphql/queries';
import { PREDICT_POLYMARKET_CLIENT } from './graphql/client';
import { PolymarketBetData } from 'types';

const USDC_DECIMALS = 6;

type PolymarketBetResponse = {
  bet: {
    id: string;
    transactionHash: string;
    shares: string;
    outcomeIndex: string;
    amount: string;
    question: {
      metadata: {
        title: string;
        outcomes: string[];
      };
      resolution: {
        payouts: string[];
        settledPrice: string;
        winningIndex: string;
      };
    };
  } | null;
};

const transformPolymarketBet = (response: PolymarketBetResponse): PolymarketBetData | null => {
  if (!response?.bet) return null;

  const { bet } = response;
  const { question, amount, shares, transactionHash } = bet;
  const outcomeIndex = parseInt(bet.outcomeIndex);
  const position = question.metadata.outcomes[outcomeIndex];

  const payoutPerShare = question.resolution.payouts[outcomeIndex];

  if (!payoutPerShare) return null;

  const totalPayoutRaw = parseFloat(shares) * parseFloat(payoutPerShare);
  const betAmount = parseFloat(amount) / Math.pow(10, USDC_DECIMALS);
  const amountWon = totalPayoutRaw / Math.pow(10, USDC_DECIMALS);

  return {
    question: question.metadata.title,
    position,
    transactionHash,
    betAmount,
    amountWon,
    betAmountFormatted: `$${betAmount.toFixed(2)}`,
    amountWonFormatted: `$${amountWon.toFixed(2)}`,
    multiplier: (amountWon / betAmount).toFixed(2),
  };
};

export const getPolymarketBet = async (id: string) => {
  const data = await PREDICT_POLYMARKET_CLIENT.request<PolymarketBetResponse>(
    getPolymarketBetQuery,
    { id },
  );
  return transformPolymarketBet(data);
};
