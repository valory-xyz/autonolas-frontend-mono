import { BigNumber, ethers as ethersV5 } from 'ethers-v5';
import { encodeAbiParameters, parseAbiParameters, zeroAddress } from 'viem';

import {
  ARBITRUM_CHAIN_ID,
  GAS_OVERRIDES,
  ROBINHOOD_CHAIN_ID,
  getArbitrumBridgePayload,
  isOrbitChainId,
} from './arbitrum-bridge';

// Aliased L1 Timelock address used as refundAccount
const ARBITRUM_REFUND_ADDRESS = '0x4d30F68F5AA342d296d4deE4bB1Cacca912dA70F';

// Mock ethers-v5
const DEPOSIT_PROCESSOR = '0xDEADBEEF00000000000000000000000000000001';
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
const mockRegisterCustomArbitrumNetwork = jest.fn();

jest.mock('@arbitrum/sdk', () => ({
  ParentToChildMessageGasEstimator: jest.fn().mockImplementation(() => ({
    estimateAll: mockEstimateAll,
    estimateSubmissionFee: mockEstimateSubmissionFee,
  })),
  registerCustomArbitrumNetwork: (...args: unknown[]) => mockRegisterCustomArbitrumNetwork(...args),
}));

// Mock libs
jest.mock('libs/util-constants/src', () => ({
  RPC_URLS: {
    1: 'https://eth-mainnet.example.com',
    4663: 'https://robinhood-mainnet.example.com',
    42161: 'https://arb-mainnet.example.com',
  },
  robinhood: { id: 4663, name: 'Robinhood Chain' },
}));

describe('ARBITRUM_CHAIN_ID', () => {
  it('should be 42161', () => {
    expect(ARBITRUM_CHAIN_ID).toBe(42161);
  });
});

describe('isOrbitChainId', () => {
  it('should accept Arbitrum One and Robinhood Chain only', () => {
    expect(isOrbitChainId(ARBITRUM_CHAIN_ID)).toBe(true);
    expect(isOrbitChainId(ROBINHOOD_CHAIN_ID)).toBe(true);
    expect(isOrbitChainId(100)).toBe(false);
    expect(isOrbitChainId(34443)).toBe(false);
  });
});

describe('getArbitrumBridgePayload', () => {
  const stakingTargets = [
    { target: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const, amount: 7n * 10n ** 18n },
    { target: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const, amount: 3n },
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
    mockL2TargetDispenser.mockResolvedValue('0xDEADBEEF00000000000000000000000000000002');

    mockEstimateAll.mockResolvedValue({
      maxFeePerGas: mockGasPriceBid,
      gasLimit: mockGasLimit,
      maxSubmissionCost: mockMaxSubmissionCost,
      deposit: mockDeposit,
    });

    mockEstimateSubmissionFee.mockResolvedValue(mockMaxSubmissionCostToken);
  });

  it('names the chain when it is given no deposit processor', async () => {
    await expect(
      getArbitrumBridgePayload(stakingTargets, ARBITRUM_CHAIN_ID, zeroAddress),
    ).rejects.toThrow(
      `No deposit processor is registered on the Dispenser for chain ${ARBITRUM_CHAIN_ID}`,
    );
    expect(mockL2TargetDispenser).not.toHaveBeenCalled();
  });

  it('should return a bridge payload of exactly 160 bytes (320 hex chars + 0x prefix)', async () => {
    const result = await getArbitrumBridgePayload(
      stakingTargets,
      ARBITRUM_CHAIN_ID,
      DEPOSIT_PROCESSOR,
    );

    // 160 bytes = 320 hex chars, plus "0x" prefix = 322 chars
    expect(result.bridgePayload).toMatch(/^0x[0-9a-f]{320}$/i);
  });

  it('should encode the correct parameters in the bridge payload', async () => {
    const result = await getArbitrumBridgePayload(
      stakingTargets,
      ARBITRUM_CHAIN_ID,
      DEPOSIT_PROCESSOR,
    );

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

  it('should return the token and message costs separately', async () => {
    const result = await getArbitrumBridgePayload(
      stakingTargets,
      ARBITRUM_CHAIN_ID,
      DEPOSIT_PROCESSOR,
    );

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

    expect(result.tokenCost).toBe(BigInt(tokenCost.toString()));
    expect(result.messageCost).toBe(BigInt(messageCost.toString()));
  });

  it('should size the message calldata to the targets that send', async () => {
    await getArbitrumBridgePayload(stakingTargets, ARBITRUM_CHAIN_ID, DEPOSIT_PROCESSOR);
    await getArbitrumBridgePayload([stakingTargets[0]], ARBITRUM_CHAIN_ID, DEPOSIT_PROCESSOR);

    const [twoTargets, oneTarget] = mockEstimateAll.mock.calls.map(
      ([{ data }]: [{ data: string }]) => data.length,
    );
    // Each target adds one address word and one amount word (2 x 32 bytes = 128 hex chars)
    expect(twoTargets - oneTarget).toBe(128);
  });

  it('estimates the L2 execution on the real targets and amounts', async () => {
    await getArbitrumBridgePayload(stakingTargets, ARBITRUM_CHAIN_ID, DEPOSIT_PROCESSOR);

    const [[{ data }]] = mockEstimateAll.mock.calls as [[{ data: string }]];
    const [innerData] = new ethersV5.utils.Interface([
      'function receiveMessage(bytes memory data)',
    ]).decodeFunctionData('receiveMessage', data);
    const [targets, amounts] = ethersV5.utils.defaultAbiCoder.decode(
      ['address[]', 'uint256[]', 'bytes32'],
      innerData,
    );
    expect(targets.map((target: string) => target.toLowerCase())).toEqual(
      stakingTargets.map(({ target }) => target),
    );
    expect(amounts.map((amount: BigNumber) => BigInt(amount.toString()))).toEqual(
      stakingTargets.map(({ amount }) => amount),
    );
  });

  it('should read l2TargetDispenser from the deposit processor it is given', async () => {
    await getArbitrumBridgePayload(stakingTargets, ARBITRUM_CHAIN_ID, DEPOSIT_PROCESSOR);

    expect(ethersV5.Contract).toHaveBeenCalledWith(
      DEPOSIT_PROCESSOR,
      [expect.stringContaining('l2TargetDispenser')],
      expect.anything(),
    );
    expect(mockL2TargetDispenser).toHaveBeenCalled();
  });

  it('should use aliased L1 timelock as refund address in estimateAll', async () => {
    await getArbitrumBridgePayload(stakingTargets, ARBITRUM_CHAIN_ID, DEPOSIT_PROCESSOR);

    expect(mockEstimateAll).toHaveBeenCalledTimes(1);
    const callArgs = mockEstimateAll.mock.calls[0][0];
    expect(callArgs.from).toBe(DEPOSIT_PROCESSOR);
    expect(callArgs.to).toBe('0xDEADBEEF00000000000000000000000000000002');
    expect(callArgs.excessFeeRefundAddress).toBe(ARBITRUM_REFUND_ADDRESS);
    expect(callArgs.callValueRefundAddress).toBe(ARBITRUM_REFUND_ADDRESS);
  });

  it('should propagate errors from SDK estimation', async () => {
    mockEstimateAll.mockRejectedValue(new Error('RPC error'));

    await expect(
      getArbitrumBridgePayload(stakingTargets, ARBITRUM_CHAIN_ID, DEPOSIT_PROCESSOR),
    ).rejects.toThrow('RPC error');
  });

  describe('Robinhood Chain', () => {
    it('should register the Orbit network once', async () => {
      await getArbitrumBridgePayload(stakingTargets, ROBINHOOD_CHAIN_ID, DEPOSIT_PROCESSOR);
      await getArbitrumBridgePayload(stakingTargets, ROBINHOOD_CHAIN_ID, DEPOSIT_PROCESSOR);

      expect(mockRegisterCustomArbitrumNetwork).toHaveBeenCalledTimes(1);
      expect(mockRegisterCustomArbitrumNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: ROBINHOOD_CHAIN_ID,
          parentChainId: 1,
          ethBridge: expect.objectContaining({
            inbox: '0x1A07cc4BD17E0118BdB54D70990D2158AbAD7a2D',
          }),
        }),
      );
    });

    it('should not register the custom network for Arbitrum One', async () => {
      await getArbitrumBridgePayload(stakingTargets, ARBITRUM_CHAIN_ID, DEPOSIT_PROCESSOR);

      expect(mockRegisterCustomArbitrumNetwork).not.toHaveBeenCalled();
    });

    it('should still produce a 160-byte payload', async () => {
      const result = await getArbitrumBridgePayload(
        stakingTargets,
        ROBINHOOD_CHAIN_ID,
        DEPOSIT_PROCESSOR,
      );

      expect(result.bridgePayload).toMatch(/^0x[0-9a-f]{320}$/i);
    });
  });
});
