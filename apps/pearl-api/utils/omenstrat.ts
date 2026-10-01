import { PredictionBetData } from '../types';
import { allocateFifo, formatBetFigures, getOmenBuyPayout, isHighReturn } from './betPayout';
import { getPredictOmenClient } from './graphql/client';
import { getOmenBetDataQuery } from './graphql/queries';

const XDAI_DECIMALS = 18;
const INVALID_ANSWER = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

type OmenBetDataResponse = {
  marketParticipants: Array<{
    totalPayout: string;
    fixedProductMarketMaker: {
      id: string;
      question: string | null;
      outcomes: string[] | null;
      currentAnswer: string | null;
    };
    bets: Array<{
      id: string;
      outcomeIndex: string;
      amount: string;
      outcomeTokenAmount: string;
      transactionHash: string;
      blockTimestamp: string;
    }>;
  }>;
};

export const getOmenBet = async (id: string): Promise<PredictionBetData | null> => {
  const { marketParticipants } = await getPredictOmenClient().request<OmenBetDataResponse>(
    getOmenBetDataQuery,
    { id: id.toLowerCase() },
  );

  const participant = marketParticipants[0];
  if (!participant) return null;

  const { fixedProductMarketMaker: market, bets, totalPayout } = participant;
  const bet = bets.find((b) => b.id.toLowerCase() === id.toLowerCase());
  if (!bet || !market.currentAnswer) return null;

  // Conditional-token redemption requires a finalized answer. A positive
  // participant payout is the settlement signal; a provisional answer plus
  // sale proceeds alone must never produce a card.
  if (BigInt(totalPayout) <= 0n) return null;

  const answer = BigInt(market.currentAnswer);
  if (answer === INVALID_ANSWER) return null;

  const buys = allocateFifo(
    bets.map((row) => ({
      id: row.id,
      outcomeIndex: Number(row.outcomeIndex),
      amount: BigInt(row.amount),
      shares: BigInt(row.outcomeTokenAmount),
      isBuy: BigInt(row.amount) > 0n,
      blockTimestamp: Number(row.blockTimestamp),
    })),
  );
  const buy = buys.find((b) => b.id === bet.id);
  if (!buy) return null;

  const won = getOmenBuyPayout(buys, bet.id, BigInt(totalPayout), Number(answer));
  if (won === null || !isHighReturn(buy.originalCost, won)) return null;

  const outcomeIndex = Number(bet.outcomeIndex);

  return {
    question: market.question ?? 'N/A',
    position: market.outcomes?.[outcomeIndex] ?? 'N/A',
    transactionHash: bet.transactionHash,
    ...formatBetFigures(buy.originalCost, won, XDAI_DECIMALS),
    marketImageUrl: null,
  };
};
