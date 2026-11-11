import { renderHook } from '@testing-library/react';
import { useReadContract, useReadContracts } from 'wagmi';

import { useNomineesWeights } from './useNomineesWeights';

jest.mock('wagmi', () => ({ useReadContract: jest.fn(), useReadContracts: jest.fn() }));

type Select = (data: unknown) => unknown;

const NOMINEES = [
  { account: '0x000000000000000000000000000000000000000a' as const, chainId: 100n },
];

/** Every staking-inflation read (`epochCounter`, `epochLen`, `inflationPerSecond`) succeeding. */
const TOKENOMICS_OK = [
  { status: 'success', result: 7n },
  { status: 'success', result: 1n },
  { status: 'success', result: 1n },
];

/** Runs each read's `select` over `results`, the way wagmi would. */
const mockReads = ({
  tokenomics,
  tokenomicsError = null,
  stakingPointError = null,
}: {
  tokenomics: { status: string; result?: unknown }[];
  tokenomicsError?: Error | null;
  stakingPointError?: Error | null;
}) => {
  jest.mocked(useReadContracts).mockImplementation((({ query }: { query: { select: Select } }) => {
    // The first call is the inflation read; the weights read stays disabled without inflation.
    const isInflation = !('enabled' in query);
    return isInflation
      ? { data: query.select(tokenomics), error: tokenomicsError }
      : { data: undefined, error: null };
  }) as never);
  jest
    .mocked(useReadContract)
    .mockReturnValue({ data: undefined, error: stakingPointError } as never);
};

describe('useNomineesWeights', () => {
  beforeEach(() => jest.resetAllMocks());

  it('reports a failed staking-inflation read, which would leave the weights read disabled', () => {
    mockReads({
      tokenomics: [
        { status: 'success', result: 7n },
        { status: 'failure' },
        { status: 'success', result: 1n },
      ],
    });

    const { result } = renderHook(() => useNomineesWeights(NOMINEES, 1));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error?.message).toBe('Could not read the staking inflation (epochLen)');
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

  it('reports no error while every read succeeds', () => {
    mockReads({
      tokenomics: TOKENOMICS_OK,
    });

    const { result } = renderHook(() => useNomineesWeights(NOMINEES, 1));

    expect(result.current.error).toBeNull();
  });
});
