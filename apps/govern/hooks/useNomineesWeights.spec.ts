import { renderHook } from '@testing-library/react';
import { useReadContract, useReadContracts } from 'wagmi';

import { useNomineesWeights } from './useNomineesWeights';

jest.mock('wagmi', () => ({ useReadContract: jest.fn(), useReadContracts: jest.fn() }));

type Select = (data: unknown) => unknown;

const B_ACCOUNT = '0x000000000000000000000000000000000000000b' as const;
const NOMINEES = [
  { account: '0x000000000000000000000000000000000000000a' as const, chainId: 100n },
];

/** Every staking-inflation read succeeding, in `TOKENOMICS_READS` order. */
const TOKENOMICS_OK = [
  { status: 'success', result: 7n },
  { status: 'success', result: 1n },
  { status: 'success', result: 1n },
];

const mockReads = ({
  tokenomics,
  tokenomicsError = null,
  stakingPointError = null,
  weightsError = null,
  weights,
  stakingPoint,
}: {
  tokenomics: { status: string; result?: unknown; error?: Error }[];
  tokenomicsError?: Error | null;
  stakingPointError?: Error | null;
  weightsError?: Error | null;
  weights?: { status: string; result?: unknown; error?: Error }[];
  stakingPoint?: Record<string, bigint>;
}) => {
  jest.mocked(useReadContracts).mockImplementation((({ query }: { query: { select: Select } }) => {
    // Only the weights read sets `enabled` (it waits for the inflation), which tells them apart.
    const isInflation = !('enabled' in query);
    return isInflation
      ? { data: query.select(tokenomics), error: tokenomicsError }
      : { data: weights && query.select(weights), error: weightsError };
  }) as never);
  jest
    .mocked(useReadContract)
    .mockReturnValue({ data: stakingPoint, error: stakingPointError } as never);
};

describe('useNomineesWeights', () => {
  beforeEach(() => jest.resetAllMocks());

  it('reports a failed staking-inflation read, which would leave the weights read disabled', () => {
    const readError = new Error('execution reverted');
    mockReads({
      tokenomics: [
        { status: 'success', result: 7n },
        { status: 'failure', error: readError },
        { status: 'success', result: 1n },
      ],
    });

    const { result } = renderHook(() => useNomineesWeights(NOMINEES, 1));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error?.message).toBe('Could not read the staking inflation (epochLen)');
    expect(result.current.error?.cause).toBe(readError);
  });

  it.each([
    ['tokenomics', { tokenomicsError: new Error('rpc down') }],
    ['staking point', { stakingPointError: new Error('rpc down') }],
  ])('reports a failed %s call as is', (_, errors) => {
    mockReads({
      tokenomics: TOKENOMICS_OK,
      ...errors,
    });

    const { result } = renderHook(() => useNomineesWeights(NOMINEES, 1));

    expect(result.current.error).toBe(Object.values(errors)[0]);
  });

  it('reports a failed weights read once the inflation reads succeeded', () => {
    const weightsError = new Error('rpc down');
    mockReads({ tokenomics: TOKENOMICS_OK, weightsError });

    const { result } = renderHook(() => useNomineesWeights(NOMINEES, 1));

    expect(result.current.error).toBe(weightsError);
  });

  it("keeps each nominee's failed weight read error, and the others' weights", () => {
    const readError = new Error('execution reverted');
    const nominees = [NOMINEES[0], { account: B_ACCOUNT, chainId: 100n }];
    mockReads({
      tokenomics: TOKENOMICS_OK,
      stakingPoint: { stakingIncentive: 1n, stakingFraction: 1n },
      weights: [
        { status: 'success', result: [10n ** 16n, 10n ** 18n] },
        { status: 'failure', error: readError },
      ],
    });

    const { result } = renderHook(() => useNomineesWeights(nominees, 1));

    expect(Object.keys(result.current.data ?? {})).toEqual([NOMINEES[0].account]);
    expect(result.current.data?.[NOMINEES[0].account]?.percentage).toBe(1);
    expect(result.current.weightReadErrors).toEqual({ [B_ACCOUNT]: readError });
  });

  it('reports no error while every read succeeds', () => {
    mockReads({
      tokenomics: TOKENOMICS_OK,
    });

    const { result } = renderHook(() => useNomineesWeights(NOMINEES, 1));

    expect(result.current.error).toBeNull();
  });
});
