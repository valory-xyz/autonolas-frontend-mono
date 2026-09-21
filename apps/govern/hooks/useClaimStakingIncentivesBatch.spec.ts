import { renderHook, act } from '@testing-library/react';
import type { Address } from 'viem';

import { useClaimStakingIncentivesBatch } from './useClaimStakingIncentivesBatch';
import { ARBITRUM_CHAIN_ID, ROBINHOOD_CHAIN_ID } from 'common-util/functions/arbitrum-bridge';

// Mock wagmi hooks
const mockWriteContract = jest.fn();

jest.mock('wagmi', () => ({
  useWriteContract: () => ({
    writeContract: mockWriteContract,
    isPending: false,
  }),
}));

// Mock the dispenser contract
jest.mock('libs/util-contracts/src/lib/abiAndAddresses', () => ({
  DISPENSER: {
    addresses: { 1: '0x5650300fCBab43A0D7D02F8Cb5d0f039402593f0' },
    abi: [],
  },
}));

// Mock the Arbitrum bridge payload
const mockGetArbitrumBridgePayload = jest.fn();
jest.mock('common-util/functions/arbitrum-bridge', () => ({
  ARBITRUM_CHAIN_ID: 42161,
  ROBINHOOD_CHAIN_ID: 4663,
  isOrbitChainId: (chainId: number) => chainId === 42161 || chainId === 4663,
  getArbitrumBridgePayload: (...args: unknown[]) => mockGetArbitrumBridgePayload(...args),
}));

describe('useClaimStakingIncentivesBatch', () => {
  const onSuccess = jest.fn();
  const onError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use empty payloads and zero values for non-Arbitrum chains', async () => {
    const { result } = renderHook(() => useClaimStakingIncentivesBatch({ onSuccess, onError }));

    const batch: [number[], Address[][]] = [
      [100, 137],
      [
        ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        ['0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
      ],
    ];

    await act(async () => {
      await result.current.claimIncentivesForBatch(batch);
    });

    expect(mockGetArbitrumBridgePayload).not.toHaveBeenCalled();
    expect(mockWriteContract).toHaveBeenCalledTimes(1);

    const callArgs = mockWriteContract.mock.calls[0][0];
    expect(callArgs.args[3]).toEqual(['0x', '0x']); // bridgePayloads
    expect(callArgs.args[4]).toEqual([BigInt(0), BigInt(0)]); // valueAmounts
    expect(callArgs.value).toBe(BigInt(0)); // total value
  });

  it('should compute Arbitrum bridge payload when batch includes Arbitrum', async () => {
    const mockPayload = '0x' + 'ab'.repeat(160);
    const mockValue = BigInt('500000000000000');

    mockGetArbitrumBridgePayload.mockResolvedValue({
      bridgePayload: mockPayload,
      value: mockValue,
    });

    const { result } = renderHook(() => useClaimStakingIncentivesBatch({ onSuccess, onError }));

    const arbTargets: Address[] = ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'];
    const otherTargets: Address[] = ['0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'];

    const batch: [number[], Address[][]] = [
      [100, ARBITRUM_CHAIN_ID],
      [otherTargets, arbTargets],
    ];

    await act(async () => {
      await result.current.claimIncentivesForBatch(batch);
    });

    expect(mockGetArbitrumBridgePayload).toHaveBeenCalledWith(arbTargets, ARBITRUM_CHAIN_ID);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);

    const callArgs = mockWriteContract.mock.calls[0][0];
    expect(callArgs.args[3]).toEqual(['0x', mockPayload]); // bridgePayloads
    expect(callArgs.args[4]).toEqual([BigInt(0), mockValue]); // valueAmounts
    expect(callArgs.value).toBe(mockValue); // total value = sum
  });

  it('should call onError when Arbitrum gas estimation fails', async () => {
    mockGetArbitrumBridgePayload.mockRejectedValue(new Error('Estimation failed'));

    const { result } = renderHook(() => useClaimStakingIncentivesBatch({ onSuccess, onError }));

    const batch: [number[], Address[][]] = [
      [ARBITRUM_CHAIN_ID],
      [['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']],
    ];

    await act(async () => {
      await result.current.claimIncentivesForBatch(batch);
    });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Estimation failed' }));
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('should handle mixed chains with correct value sum', async () => {
    const mockPayload = '0x' + 'cd'.repeat(160);
    const mockValue = BigInt('1000000000000000');

    mockGetArbitrumBridgePayload.mockResolvedValue({
      bridgePayload: mockPayload,
      value: mockValue,
    });

    const { result } = renderHook(() => useClaimStakingIncentivesBatch({ onSuccess, onError }));

    const batch: [number[], Address[][]] = [
      [10, ARBITRUM_CHAIN_ID, 137],
      [
        ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        ['0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
        ['0xcccccccccccccccccccccccccccccccccccccccc'],
      ],
    ];

    await act(async () => {
      await result.current.claimIncentivesForBatch(batch);
    });

    const callArgs = mockWriteContract.mock.calls[0][0];
    // Chain order: Optimism (0x), Arbitrum (payload), Polygon (0x)
    expect(callArgs.args[3]).toEqual(['0x', mockPayload, '0x']);
    expect(callArgs.args[4]).toEqual([BigInt(0), mockValue, BigInt(0)]);
    expect(callArgs.value).toBe(mockValue); // only Arbitrum contributes value
  });

  it('should estimate a payload per Orbit chain and sum their values', async () => {
    const arbPayload = '0x' + 'ab'.repeat(160);
    const arbValue = BigInt('500000000000000');
    const robinhoodPayload = '0x' + 'ef'.repeat(160);
    const robinhoodValue = BigInt('250000000000000');

    mockGetArbitrumBridgePayload.mockImplementation((_targets: Address[], chainId: number) =>
      Promise.resolve(
        chainId === ROBINHOOD_CHAIN_ID
          ? { bridgePayload: robinhoodPayload, value: robinhoodValue }
          : { bridgePayload: arbPayload, value: arbValue },
      ),
    );

    const { result } = renderHook(() => useClaimStakingIncentivesBatch({ onSuccess, onError }));

    const robinhoodTargets: Address[] = ['0xcccccccccccccccccccccccccccccccccccccccc'];
    const batch: [number[], Address[][]] = [
      [ARBITRUM_CHAIN_ID, 100, ROBINHOOD_CHAIN_ID],
      [
        ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        ['0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
        robinhoodTargets,
      ],
    ];

    await act(async () => {
      await result.current.claimIncentivesForBatch(batch);
    });

    expect(mockGetArbitrumBridgePayload).toHaveBeenCalledTimes(2);
    expect(mockGetArbitrumBridgePayload).toHaveBeenCalledWith(robinhoodTargets, ROBINHOOD_CHAIN_ID);

    const callArgs = mockWriteContract.mock.calls[0][0];
    expect(callArgs.args[3]).toEqual([arbPayload, '0x', robinhoodPayload]);
    expect(callArgs.args[4]).toEqual([arbValue, BigInt(0), robinhoodValue]);
    expect(callArgs.value).toBe(arbValue + robinhoodValue);
  });
});
