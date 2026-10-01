import {
  allocateFifo,
  formatBetFigures,
  getOmenBuyPayout,
  getPolymarketBuyPayout,
  isHighReturn,
  PayoutBetRow,
} from './betPayout';

const WEI = 10n ** 18n;

const row = (
  id: string,
  amount: bigint,
  shares: bigint,
  blockTimestamp: number,
  outcomeIndex = 0,
): PayoutBetRow => ({ id, outcomeIndex, amount, shares, isBuy: amount > 0n, blockTimestamp });

describe('getOmenBuyPayout', () => {
  it('gives a single buy the whole participant payout', () => {
    const buys = allocateFifo([row('buy', 1n * WEI, 2n * WEI, 1)]);

    expect(getOmenBuyPayout(buys, 'buy', 2n * WEI, 0)).toBe(2n * WEI);
  });

  // Same inputs and expected per-buy payouts as the trader's multi-bet parity fixture
  // (test_multi_bet_per_buy_payout_parity_fixture); keep the two in sync.
  it('reproduces the trader multi-bet parity fixture', () => {
    const buys = allocateFifo([
      row('sell_1', -1n * WEI, -2n * WEI, 3000),
      row('buy_2', 1n * WEI, 2n * WEI, 2000),
      row('buy_1', 2n * WEI, 4n * WEI, 1000),
    ]);

    expect(getOmenBuyPayout(buys, 'buy_1', 4n * WEI, 0)).toBe(3n * WEI);
    expect(getOmenBuyPayout(buys, 'buy_2', 4n * WEI, 0)).toBe(2n * WEI);
  });

  it('splits the payout between two unsold winning buys by cost', () => {
    const buys = allocateFifo([row('a', 1n * WEI, 2n * WEI, 1), row('b', 3n * WEI, 6n * WEI, 2)]);

    expect(getOmenBuyPayout(buys, 'a', 8n * WEI, 0)).toBe(2n * WEI);
    expect(getOmenBuyPayout(buys, 'b', 8n * WEI, 0)).toBe(6n * WEI);
  });

  it('ignores buys on the losing outcome when pro-rating', () => {
    const buys = allocateFifo([
      row('win', 1n * WEI, 2n * WEI, 1, 0),
      row('lose', 5n * WEI, 9n * WEI, 2, 1),
    ]);

    expect(getOmenBuyPayout(buys, 'win', 2n * WEI, 0)).toBe(2n * WEI);
  });

  it('returns null for a buy on the losing outcome', () => {
    const buys = allocateFifo([row('lose', 1n * WEI, 2n * WEI, 1, 1)]);

    expect(getOmenBuyPayout(buys, 'lose', 2n * WEI, 0)).toBeNull();
  });

  it('rejects an unredeemed Omen buy despite sell proceeds', () => {
    const buys = allocateFifo([
      row('buy', 2n * WEI, 4n * WEI, 1),
      row('sell', -1n * WEI, -2n * WEI, 2),
    ]);

    expect(getOmenBuyPayout(buys, 'buy', 0n, 0)).toBeNull();
  });

  it('returns realized proceeds for a settled profitable fully sold buy', () => {
    const buys = allocateFifo([
      row('buy', 1n * WEI, 2n * WEI, 1, 0),
      { ...row('sell', -2n * WEI, -2n * WEI, 2, 0), isBuy: false },
    ]);

    expect(getOmenBuyPayout(buys, 'buy', 0n, 1, '1700000000')).toBe(2n * WEI);
    expect(getOmenBuyPayout(buys, 'buy', 0n, 1, null)).toBeNull();
  });
});

describe('getPolymarketBuyPayout', () => {
  const USDC = 1_000_000n;

  it('pays one unit per unsold winning share once paid out', () => {
    const buys = allocateFifo([
      row('a', 1n * USDC, 2n * USDC, 1),
      row('b', 1n * USDC, 3n * USDC, 2),
    ]);

    expect(getPolymarketBuyPayout(buys, 'a', 5n * USDC, 0)).toBe(2n * USDC);
    expect(getPolymarketBuyPayout(buys, 'b', 5n * USDC, 0)).toBe(3n * USDC);
  });

  it.each([0n, 9_999n, 10_000n, 10_001n, 2n * USDC])(
    'handles remaining shares %s with trader dust semantics',
    (remainingShares) => {
      const buys = allocateFifo([
        row('buy', 2n * USDC, 4n * USDC, 1),
        { ...row('sell', -3n * USDC, -(4n * USDC - remainingShares), 2), isBuy: false },
      ]);

      expect(getPolymarketBuyPayout(buys, 'buy', 2n * USDC, 0)).toBe(
        3n * USDC + (remainingShares <= 10_000n ? 0n : remainingShares),
      );
    },
  );

  it('returns null for a losing buy', () => {
    const buys = allocateFifo([row('buy', 1n * USDC, 2n * USDC, 1, 1)]);

    expect(getPolymarketBuyPayout(buys, 'buy', 2n * USDC, 0)).toBeNull();
  });
});

describe('formatBetFigures', () => {
  it('formats amounts and the multiplier', () => {
    expect(formatBetFigures(1_000_000n, 2_400_000n, 6)).toEqual({
      betAmount: 1,
      amountWon: 2.4,
      betAmountFormatted: '$1.00',
      amountWonFormatted: '$2.40',
      multiplier: '2.40',
    });
  });
});

describe('isHighReturn', () => {
  it('uses the same three-decimal values as the trader achievement checker', () => {
    expect(isHighReturn(1_000_400n, 1_500_600n, 6)).toBe(true);
    expect(isHighReturn(1_000_000n, 1_500_000n, 6)).toBe(false);
    expect(isHighReturn(1_000_400_000_000_000_000n, 1_500_600_000_000_000_000n, 18)).toBe(true);
  });
});
