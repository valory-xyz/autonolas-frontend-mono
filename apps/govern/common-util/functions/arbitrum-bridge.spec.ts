import { BigNumber } from 'ethers-v5';
import { encodeAbiParameters, parseAbiParameters } from 'viem';

import { ARBITRUM_CHAIN_ID, GAS_OVERRIDES, getArbitrumBridgePayload } from './arbitrum-bridge';

// Aliased L1 Timelock address used as refundAccount
const ARBITRUM_REFUND_ADDRESS = '0x4d30F68F5AA342d296d4deE4bB1Cacca912dA70F';

// Mock ethers-v5
const mockMapChainIdDepositProcessors = jest.fn();
const mockL2TargetDispenser = jest.fn();

const mockGetBlock = jest.fn().mockResolvedValue({
  baseFeePerGas: BigNumber.from('1000000000'), // 1 gwei
});

jest.mock('ethers-v5', () => {
  const actual = jest.requireActual('ethers-v5');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      providers: {
        JsonRpcProvider: jest.fn().mockImplementation(() => ({
          getBlock: (...args: unknown[]) => mockGetBlock(...args),
        })),
      },
      Contract: jest.fn().mockImplementation((_address: string, abi: string[]) => {
        if (abi[0].includes('mapChainIdDepositProcessors')) {
          return { mapChainIdDepositProcessors: mockMapChainIdDepositProcessors };
        }
        if (abi[0].includes('l2TargetDispenser')) {
          return { l2TargetDispenser: mockL2TargetDispenser };
        }
        return {};
      }),
    },
  };
});

// Mock @arbitrum/sdk
const mockEstimateAll = jest.fn();
const mockEstimateSubmissionFee = jest.fn();

jest.mock('@arbitrum/sdk', () => ({
  ParentToChildMessageGasEstimator: jest.fn().mockImplementation(() => ({
    estimateAll: mockEstimateAll,
    estimateSubmissionFee: mockEstimateSubmissionFee,
  })),
}));

// Mock libs
jest.mock('libs/util-constants/src', () => ({
  RPC_URLS: {
    1: 'https://eth-mainnet.example.com',
    42161: 'https://arb-mainnet.example.com',
  },
}));

jest.mock('libs/util-contracts/src/lib/abiAndAddresses', () => ({
  DISPENSER: {
    addresses: { 1: '0x5650300fCBab43A0D7D02F8Cb5d0f039402593f0' },
  },
}));

describe('ARBITRUM_CHAIN_ID', () => {
  it('should be 42161', () => {
    expect(ARBITRUM_CHAIN_ID).toBe(42161);
  });
});

describe('getArbitrumBridgePayload', () => {
  const stakingTargets = [
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const,
  ];

  const mockGasPriceBid = BigNumber.from('100000000'); // 0.1 gwei
  const mockGasLimit = BigNumber.from('2000000');
  const mockMaxSubmissionCost = BigNumber.from('50000000000000'); // 0.00005 ETH
  const mockDeposit = BigNumber.from('300000000000000'); // 0.0003 ETH
  const mockMaxSubmissionCostToken = BigNumber.from('40000000000000'); // 0.00004 ETH

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetBlock.mockResolvedValue({
      baseFeePerGas: BigNumber.from('1000000000'), // 1 gwei
    });
    mockMapChainIdDepositProcessors.mockResolvedValue('0xDEADBEEF00000000000000000000000000000001');
    mockL2TargetDispenser.mockResolvedValue('0xDEADBEEF00000000000000000000000000000002');

    mockEstimateAll.mockResolvedValue({
      maxFeePerGas: mockGasPriceBid,
      gasLimit: mockGasLimit,
      maxSubmissionCost: mockMaxSubmissionCost,
      deposit: mockDeposit,
    });

    mockEstimateSubmissionFee.mockResolvedValue(mockMaxSubmissionCostToken);
  });

  it('should return a bridge payload of exactly 160 bytes (320 hex chars + 0x prefix)', async () => {
    const result = await getArbitrumBridgePayload(stakingTargets);

    // 160 bytes = 320 hex chars, plus "0x" prefix = 322 chars
    expect(result.bridgePayload).toMatch(/^0x[0-9a-f]{320}$/i);
  });

  it('should encode the correct parameters in the bridge payload', async () => {
    const result = await getArbitrumBridgePayload(stakingTargets);

    // The gas limit in the payload should include the 100k buffer
    const expectedGasLimitMessage = mockGasLimit.add(100_000);
    // Token submission cost includes the same safety buffer as GAS_OVERRIDES (ceiling division)
    const bufferedTokenSubmissionCost = mockMaxSubmissionCostToken
      .mul(GAS_OVERRIDES.maxSubmissionFee.percentIncrease.add(100))
      .add(99)
      .div(100);

    const expectedPayload = encodeAbiParameters(
      parseAbiParameters('address, uint256, uint256, uint256, uint256'),
      [
        ARBITRUM_REFUND_ADDRESS,
        BigInt(mockGasPriceBid.toString()),
        BigInt(bufferedTokenSubmissionCost.toString()),
        BigInt(expectedGasLimitMessage.toString()),
        BigInt(mockMaxSubmissionCost.toString()),
      ],
    );

    expect(result.bridgePayload).toBe(expectedPayload);
  });

  it('should calculate the correct total cost', async () => {
    const result = await getArbitrumBridgePayload(stakingTargets);

    const gasLimitMessage = mockGasLimit.add(100_000);
    const TOKEN_GAS_LIMIT = 300_000;
    // Token submission cost includes the same safety buffer as GAS_OVERRIDES (ceiling division)
    const bufferedTokenSubmissionCost = mockMaxSubmissionCostToken
      .mul(GAS_OVERRIDES.maxSubmissionFee.percentIncrease.add(100))
      .add(99)
      .div(100);

    // tokenCost = bufferedMaxSubmissionCostToken + gasPriceBid * TOKEN_GAS_LIMIT
    const tokenCost = bufferedTokenSubmissionCost.add(mockGasPriceBid.mul(TOKEN_GAS_LIMIT));
    // messageCost = maxSubmissionCost + gasLimitMessage * gasPriceBid
    const messageCost = mockMaxSubmissionCost.add(gasLimitMessage.mul(mockGasPriceBid));
    const expectedTotalCost = tokenCost.add(messageCost);

    expect(result.value).toBe(BigInt(expectedTotalCost.toString()));
  });

  it('should read deposit processor address from dispenser contract', async () => {
    await getArbitrumBridgePayload(stakingTargets);

    expect(mockMapChainIdDepositProcessors).toHaveBeenCalledWith(ARBITRUM_CHAIN_ID);
  });

  it('should read l2TargetDispenser from deposit processor contract', async () => {
    await getArbitrumBridgePayload(stakingTargets);

    expect(mockL2TargetDispenser).toHaveBeenCalled();
  });

  it('should use aliased L1 timelock as refund address in estimateAll', async () => {
    await getArbitrumBridgePayload(stakingTargets);

    expect(mockEstimateAll).toHaveBeenCalledTimes(1);
    const callArgs = mockEstimateAll.mock.calls[0][0];
    expect(callArgs.from).toBe('0xDEADBEEF00000000000000000000000000000001');
    expect(callArgs.to).toBe('0xDEADBEEF00000000000000000000000000000002');
    expect(callArgs.excessFeeRefundAddress).toBe(ARBITRUM_REFUND_ADDRESS);
    expect(callArgs.callValueRefundAddress).toBe(ARBITRUM_REFUND_ADDRESS);
  });

  it('should propagate errors from SDK estimation', async () => {
    mockEstimateAll.mockRejectedValue(new Error('RPC error'));

    await expect(getArbitrumBridgePayload(stakingTargets)).rejects.toThrow('RPC error');
  });
});
