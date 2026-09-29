/**
 * Per-bet payout for winning cards, ported from the trader agent
 * (`allocate_fifo`, `_calculate_bet_net_profit`, `_redemption_value`) so the
 * X preview, the olas-predict page and the Pearl pop-up show the same figure
 * when an agent holds several bets in one market.
 */

export type PayoutBetRow = {
  id: string;
  outcomeIndex: number;
  /** Signed, in collateral base units; negative for a sell. */
  amount: bigint;
  /** Signed outcome-token amount; negative for a sell. */
  shares: bigint;
  isBuy: boolean;
  blockTimestamp: number;
};

export type FifoBuy = {
  id: string;
  outcomeIndex: number;
  originalCost: bigint;
  originalShares: bigint;
  remainingShares: bigint;
  allocatedProceeds: bigint;
  allocatedCost: bigint;
};

const max = (a: bigint, b: bigint) => (a > b ? a : b);
const min = (a: bigint, b: bigint) => (a < b ? a : b);

const remainingCost = (buy: FifoBuy) => max(buy.originalCost - buy.allocatedCost, 0n);

/**
 * FIFO-matches sells against earlier buys of the same outcome within one
 * participant's position in one market. Sells are folded into the buys they
 * consume and do not appear in the result.
 */
export const allocateFifo = (rows: PayoutBetRow[]): FifoBuy[] => {
  const groups = new Map<number, PayoutBetRow[]>();
  rows.forEach((row) => {
    groups.set(row.outcomeIndex, [...(groups.get(row.outcomeIndex) ?? []), row]);
  });

  const output: FifoBuy[] = [];
  groups.forEach((groupRows) => {
    const sorted = [...groupRows].sort(
      (a, b) => a.blockTimestamp - b.blockTimestamp || a.id.localeCompare(b.id),
    );
    const openBuys: FifoBuy[] = [];

    sorted.forEach((row) => {
      if (row.isBuy) {
        const buy: FifoBuy = {
          id: row.id,
          outcomeIndex: row.outcomeIndex,
          originalCost: row.amount,
          originalShares: row.shares,
          remainingShares: row.shares,
          allocatedProceeds: 0n,
          allocatedCost: 0n,
        };
        output.push(buy);
        if (row.shares > 0n) openBuys.push(buy);
        return;
      }

      const soldShares = -row.shares;
      const proceeds = -row.amount;
      let toConsume = soldShares;
      while (toConsume > 0n && openBuys.length > 0) {
        const head = openBuys[0];
        const take = min(toConsume, head.remainingShares);
        head.allocatedProceeds += (proceeds * take) / soldShares;
        head.allocatedCost += (head.originalCost * take) / head.originalShares;
        head.remainingShares -= take;
        toConsume -= take;
        if (head.remainingShares <= 0n) openBuys.shift();
      }
    });
  });

  return output;
};

/**
 * Omen: this buy's sell proceeds plus its share of the participant's payout,
 * pro-rated by unsold cost across the participant's winning buys.
 * Returns null when the buy is not on the winning outcome.
 */
export const getOmenBuyPayout = (
  buys: FifoBuy[],
  buyId: string,
  totalPayout: bigint,
  winningIndex: number,
): bigint | null => {
  const buy = buys.find(({ id }) => id === buyId);
  if (!buy || buy.outcomeIndex !== winningIndex) return null;

  const winningTotal = buys
    .filter(({ outcomeIndex }) => outcomeIndex === winningIndex)
    .reduce((sum, winningBuy) => sum + remainingCost(winningBuy), 0n);

  if (totalPayout <= 0n || winningTotal <= 0n) return buy.allocatedProceeds;

  return buy.allocatedProceeds + (totalPayout * remainingCost(buy)) / winningTotal;
};

/**
 * Polymarket: this buy's sell proceeds plus one collateral unit per unsold
 * share, counted once the participant has been paid out.
 * Returns null when the buy is not on the winning outcome.
 */
export const getPolymarketBuyPayout = (
  buys: FifoBuy[],
  buyId: string,
  totalPayout: bigint,
  winningIndex: number,
): bigint | null => {
  const buy = buys.find(({ id }) => id === buyId);
  if (!buy || buy.outcomeIndex !== winningIndex) return null;

  if (totalPayout <= 0n || buy.remainingShares <= 0n) return buy.allocatedProceeds;

  return buy.allocatedProceeds + buy.remainingShares;
};

export type BetFigures = {
  betAmount: number;
  amountWon: number;
  betAmountFormatted: string;
  amountWonFormatted: string;
  multiplier: string;
};

export const formatBetFigures = (cost: bigint, won: bigint, decimals: number): BetFigures => {
  const scale = Math.pow(10, decimals);
  const betAmount = Number(cost) / scale;
  const amountWon = Number(won) / scale;

  return {
    betAmount,
    amountWon,
    betAmountFormatted: `$${betAmount.toFixed(2)}`,
    amountWonFormatted: `$${amountWon.toFixed(2)}`,
    multiplier: amountWon > 0 && betAmount > 0 ? (amountWon / betAmount).toFixed(2) : '0.00',
  };
};
