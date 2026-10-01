import { getOmenBet } from './omenstrat';

const mockRequest = jest.fn();
jest.mock('./graphql/client', () => ({
  getPredictOmenClient: () => ({ request: (...args: unknown[]) => mockRequest(...args) }),
}));

const WEI = 10n ** 18n;
const YES = `0x${'0'.repeat(64)}`;
const NO = `0x${'0'.repeat(63)}1`;
const INVALID = `0x${'f'.repeat(64)}`;
const BUY_ID = `0x${'a'.repeat(64)}01000000`;
const TX_HASH = `0x${'a'.repeat(64)}`;

const bet = (id: string, amount: bigint, shares: bigint, blockTimestamp: number) => ({
  id,
  outcomeIndex: '0',
  amount: amount.toString(),
  outcomeTokenAmount: shares.toString(),
  transactionHash: TX_HASH,
  blockTimestamp: String(blockTimestamp),
});

const response = ({
  currentAnswer = YES as string | null,
  totalPayout = 24n * 10n ** 17n,
  bets = [bet(BUY_ID, 1n * WEI, 24n * 10n ** 17n, 1)],
} = {}) => ({
  marketParticipants: [
    {
      totalPayout: totalPayout.toString(),
      fixedProductMarketMaker: {
        id: '0xmarket',
        question: 'Does Google have the best AI model end of January?',
        outcomes: ['Yes', 'No'],
        currentAnswer,
      },
      bets,
    },
  ],
});

describe('getOmenBet', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it('returns the card figures of a winning buy', async () => {
    mockRequest.mockResolvedValue(response());

    await expect(getOmenBet(BUY_ID)).resolves.toEqual({
      question: 'Does Google have the best AI model end of January?',
      position: 'Yes',
      transactionHash: TX_HASH,
      betAmount: 1,
      amountWon: 2.4,
      betAmountFormatted: '$1.00',
      amountWonFormatted: '$2.40',
      multiplier: '2.40',
      marketImageUrl: null,
    });
  });

  it("uses this buy's share of the payout, not the whole market payout", async () => {
    const otherBuy = `0x${'b'.repeat(64)}01000000`;
    mockRequest.mockResolvedValue(
      response({
        totalPayout: 4n * WEI,
        bets: [bet(BUY_ID, 1n * WEI, 2n * WEI, 1), bet(otherBuy, 1n * WEI, 2n * WEI, 2)],
      }),
    );

    const data = await getOmenBet(BUY_ID);

    expect(data?.amountWon).toBe(2);
    expect(data?.multiplier).toBe('2.00');
  });

  it.each([
    ['the participant is unknown', { marketParticipants: [] }],
    ['the market is unresolved', response({ currentAnswer: null })],
    ['the market is invalid', response({ currentAnswer: INVALID })],
    ['the buy lost', response({ currentAnswer: NO })],
    ['the bet is not in the participant history', response({ bets: [] })],
  ])('returns null when %s', async (_, data) => {
    mockRequest.mockResolvedValue(data);

    await expect(getOmenBet(BUY_ID)).resolves.toBeNull();
  });

  it('never exposes the bettor address', async () => {
    mockRequest.mockResolvedValue(response());

    const data = await getOmenBet(BUY_ID);

    expect(Object.keys(data ?? {})).not.toContain('bettor');
  });
});
