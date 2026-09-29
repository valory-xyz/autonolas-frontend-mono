import { PredictionBetData } from '../types';
import { allocateFifo, formatBetFigures, getOmenBuyPayout } from './betPayout';
import { getPredictOmenClient } from './graphql/client';
import { getOmenBetDataQuery } from './graphql/queries';
import { getMarketImageUrl } from './marketThumbnail';

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

/**
 * Returns the card figures for an Omen buy that won, or null when the bet is
 * unknown, the market is unresolved or invalid, or the buy did not win.
 */
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
  if (won === null || won <= 0n) return null;

  const outcomeIndex = Number(bet.outcomeIndex);

  return {
    question: market.question ?? 'N/A',
    position: market.outcomes?.[outcomeIndex] ?? 'N/A',
    transactionHash: bet.transactionHash,
    ...formatBetFigures(buy.originalCost, won, XDAI_DECIMALS),
    marketImageUrl: await getMarketImageUrl(market.id),
  };
};
