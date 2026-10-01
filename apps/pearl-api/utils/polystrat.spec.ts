import { getPolymarketBet, toSquidBetId } from './polystrat';

const mockRequest = jest.fn();
jest.mock('./graphql/client', () => ({
  getPredictPolymarketClient: () => ({ request: (...args: unknown[]) => mockRequest(...args) }),
}));

const USDC = 1_000_000n;
const TX_HASH = `0x${'9'.repeat(64)}`;
const SQUID_ID = `${TX_HASH}_1460`;
const LEGACY_ID = `${TX_HASH}b4050000`;

const row = (
  id: string,
  amount: bigint,
  shares: bigint,
  isBuy: boolean,
  blockTimestamp: number,
) => ({
  id,
  outcomeIndex: '0',
  amount: amount.toString(),
  shares: shares.toString(),
  isBuy,
  blockTimestamp: String(blockTimestamp),
});

const response = ({
  winningIndex = '0' as string | null,
  totalPayout = 5n * USDC,
  bets = [
    row(SQUID_ID, 1n * USDC, 2n * USDC, true, 1),
    row('other', 1n * USDC, 3n * USDC, true, 2),
  ],
} = {}) => ({
  betById: {
    id: SQUID_ID,
    outcomeIndex: '0',
    transactionHash: TX_HASH,
    question: {
      metadata: { title: 'Will it rain?' },
      resolution: winningIndex === null ? null : { winningIndex },
    },
    marketParticipant: { totalPayout: totalPayout.toString(), bets },
  },
});

describe('toSquidBetId', () => {
  it('converts a legacy id to the squid form', () => {
    expect(toSquidBetId(LEGACY_ID)).toBe(SQUID_ID);
  });

  it('passes a squid id through', () => {
    expect(toSquidBetId(SQUID_ID)).toBe(SQUID_ID);
  });

  it('rejects anything else', () => {
    expect(toSquidBetId('abc')).toBeNull();
  });
});

describe('getPolymarketBet', () => {
  beforeEach(() => mockRequest.mockReset());

  it("uses this buy's shares, not the participant's whole payout", async () => {
    mockRequest.mockResolvedValue(response());

    const data = await getPolymarketBet(SQUID_ID);

    expect(data).toMatchObject({
      question: 'Will it rain?',
      position: 'Yes',
      transactionHash: TX_HASH,
      betAmountFormatted: '$1.00',
      amountWonFormatted: '$2.00',
      multiplier: '2.00',
      marketImageUrl: null,
    });
  });

  it('queries the squid with the converted id for a legacy id', async () => {
    mockRequest.mockResolvedValue(response());

    await getPolymarketBet(LEGACY_ID);

    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), { id: SQUID_ID });
  });

  it.each([
    ['the market is unresolved', response({ winningIndex: null })],
    ['the participant has not redeemed', response({ totalPayout: 0n })],
    ['the return is exactly 1.5x', response({ bets: [row(SQUID_ID, USDC, 1_500_000n, true, 1)] })],
    [
      'the buy was sold at a loss',
      response({
        bets: [
          row(SQUID_ID, USDC, 2n * USDC, true, 1),
          row('sell', -400_000n, -2n * USDC, false, 2),
        ],
      }),
    ],
    ['the market was cancelled', response({ winningIndex: '-1' })],
    ['the buy lost', response({ winningIndex: '1' })],
    ['the bet does not exist', { betById: null }],
  ])('returns null when %s', async (_, data) => {
    mockRequest.mockResolvedValue(data);

    await expect(getPolymarketBet(SQUID_ID)).resolves.toBeNull();
  });

  it('does not query for an id it cannot map', async () => {
    await expect(getPolymarketBet('abc')).resolves.toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
  });
});
