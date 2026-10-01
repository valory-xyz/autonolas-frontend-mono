import { PredictionBetData } from '../types';
import { allocateFifo, formatBetFigures, getPolymarketBuyPayout, isHighReturn } from './betPayout';
import { getPredictPolymarketClient } from './graphql/client';
import { getPolymarketDataQuery } from './graphql/queries';

const USDC_DECIMALS = 6;
// Positional, not read from the market metadata: the squid's `metadata.outcomes` is ordered
// independently of a bet's `outcomeIndex`. Index 0 is Yes.
const OUTCOMES = ['Yes', 'No'];

// Older achievement records carry the retired subgraph's id: the transaction hash followed by the
// log index as four little-endian bytes. The squid keys bets as `{txHash}_{logIndex}`.
const LEGACY_BET_ID = /^0x([0-9a-fA-F]{64})([0-9a-fA-F]{8})$/;
const SQUID_BET_ID = /^0x[0-9a-fA-F]{64}_\d+$/;

export const toSquidBetId = (betId: string): string | null => {
  if (SQUID_BET_ID.test(betId)) return betId.toLowerCase();

  const legacy = LEGACY_BET_ID.exec(betId);
  if (!legacy) return null;

  const [, transactionHash, logIndexBytes] = legacy;
  const logIndex = parseInt((logIndexBytes.match(/../g) as string[]).reverse().join(''), 16);

  return `0x${transactionHash.toLowerCase()}_${logIndex}`;
};

type PolymarketDataResponse = {
  betById: {
    id: string;
    outcomeIndex: string;
    transactionHash: string;
    question: {
      metadata: { title: string } | null;
      resolution: { winningIndex: string } | null;
    } | null;
    marketParticipant: {
      totalPayout: string;
      bets: Array<{
        id: string;
        outcomeIndex: string;
        amount: string;
        shares: string;
        isBuy: boolean;
        blockTimestamp: string;
      }>;
    } | null;
  } | null;
};

export const getPolymarketBet = async (id: string): Promise<PredictionBetData | null> => {
  const squidBetId = toSquidBetId(id);
  if (!squidBetId) return null;

  const { betById: bet } = await getPredictPolymarketClient().request<PolymarketDataResponse>(
    getPolymarketDataQuery,
    { id: squidBetId },
  );
  if (!bet?.marketParticipant) return null;

  const winningIndex = bet.question?.resolution?.winningIndex;
  if (winningIndex === undefined || winningIndex === null || Number(winningIndex) < 0) return null;

  const { bets, totalPayout } = bet.marketParticipant;
  const buys = allocateFifo(
    bets.map((row) => ({
      id: row.id,
      outcomeIndex: Number(row.outcomeIndex),
      amount: BigInt(row.amount),
      shares: BigInt(row.shares),
      isBuy: row.isBuy,
      blockTimestamp: Number(row.blockTimestamp),
    })),
  );
  const buy = buys.find((b) => b.id === bet.id);
  if (!buy) return null;

  const won = getPolymarketBuyPayout(buys, bet.id, BigInt(totalPayout), Number(winningIndex));
  if (won === null || !isHighReturn(buy.originalCost, won)) return null;

  return {
    question: bet.question?.metadata?.title ?? 'N/A',
    position: OUTCOMES[Number(bet.outcomeIndex)] ?? 'N/A',
    transactionHash: bet.transactionHash,
    ...formatBetFigures(buy.originalCost, won, USDC_DECIMALS),
    marketImageUrl: null,
  };
};
