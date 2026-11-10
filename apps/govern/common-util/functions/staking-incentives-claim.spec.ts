import {
  type Address,
  type Hex,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  HttpRequestError,
  UserRejectedRequestError,
  decodeFunctionData,
  encodeErrorResult,
  encodeFunctionResult,
  multicall3Abi,
  pad,
} from 'viem';

import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import {
  type ClaimBatch,
  isContractRevert,
  prepareClaim,
  quoteChainClaims,
  toClaimError,
} from './staking-incentives-claim';

const mockReadContracts = jest.fn();
const mockSimulateContract = jest.fn();
jest.mock('@wagmi/core', () => ({
  readContracts: (...args: unknown[]) => mockReadContracts(...args),
  simulateContract: (...args: unknown[]) => mockSimulateContract(...args),
}));
jest.mock('common-util/config/wagmi', () => ({ wagmiConfig: {} }));

const mockGetArbitrumBridgePayload = jest.fn();
jest.mock('./arbitrum-bridge', () => ({
  isOrbitChainId: (chainId: number) => chainId === 42161 || chainId === 4663,
  getArbitrumBridgePayload: (...args: unknown[]) => mockGetArbitrumBridgePayload(...args),
}));

const ARBITRUM = 42161;
const GNOSIS = 100;
const ORBIT_PAYLOAD = `0x${'ab'.repeat(160)}` as Hex;
const MESSAGE_COST = BigInt(700);
const TOKEN_COST = BigInt(300);
const ZERO = BigInt(0);
const OLAS = BigInt(10) ** BigInt(18);

const target = (n: number) => pad(`0x${n.toString(16)}`, { size: 32 }) as Address;

type ChainSetup = { withheld?: bigint; bridgingDecimals?: bigint };

/**
 * Mocks the chain reads: per chain the processor and withheld amount, then bridging decimals,
 * then one aggregate3 call answering each target's calculateStakingIncentives with `incentives`.
 */
const mockChainState = (chains: ChainSetup[], incentives: bigint[][]) => {
  mockReadContracts
    .mockResolvedValueOnce(
      chains.flatMap(({ withheld = ZERO }, i) => [
        `0x${(i + 1).toString(16).padStart(40, '0')}`,
        withheld,
      ]),
    )
    .mockResolvedValueOnce(chains.map(({ bridgingDecimals = BigInt(18) }) => bridgingDecimals));

  const result = incentives.flat().flatMap((incentive) => [
    { success: true, returnData: '0x' },
    {
      success: true,
      returnData: encodeFunctionResult({
        abi: DISPENSER.abi,
        functionName: 'calculateStakingIncentives',
        result: [incentive, ZERO, BigInt(5), target(0), []],
      }),
    },
  ]);
  mockSimulateContract.mockImplementation(
    (_config: unknown, { functionName }: { functionName: string }) =>
      Promise.resolve(
        functionName === 'aggregate3'
          ? { result }
          : { request: { functionName }, result: undefined },
      ),
  );
};

describe('quoteChainClaims', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetArbitrumBridgePayload.mockResolvedValue({
      bridgePayload: ORBIT_PAYLOAD,
      messageCost: MESSAGE_COST,
      tokenCost: TOKEN_COST,
    });
  });

  it('attaches no value and no payload to an Orbit chain whose incentives are all zero', async () => {
    mockChainState([{}], [[ZERO, ZERO]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1), target(2)]]]);

    expect(quote).toMatchObject({ sendsMessage: false, value: ZERO, bridgePayload: '0x' });
    expect(mockGetArbitrumBridgePayload).not.toHaveBeenCalled();
  });

  it('charges the message and token costs for a positive incentive bridged as fresh OLAS', async () => {
    mockChainState([{}], [[OLAS]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1)]]]);

    expect(quote).toMatchObject({
      sendsMessage: true,
      value: MESSAGE_COST + TOKEN_COST,
      bridgePayload: ORBIT_PAYLOAD,
    });
  });

  it('still charges the message when withheld OLAS covers the whole incentive', async () => {
    mockChainState([{ withheld: OLAS * BigInt(2) }], [[OLAS]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1)]]]);

    expect(quote).toMatchObject({ sendsMessage: true, value: MESSAGE_COST });
  });

  it('charges the token cost when withheld OLAS covers only part of the incentive', async () => {
    mockChainState([{ withheld: OLAS / BigInt(2) }], [[OLAS]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1)]]]);

    expect(quote.value).toBe(MESSAGE_COST + TOKEN_COST);
  });

  it('keeps one chain fee and zero for the others in a mixed batch', async () => {
    mockChainState([{}, {}], [[OLAS], [OLAS]]);

    const quotes = await quoteChainClaims([
      [GNOSIS, ARBITRUM],
      [[target(1)], [target(2)]],
    ]);

    expect(quotes.map(({ value }) => value)).toEqual([ZERO, MESSAGE_COST + TOKEN_COST]);
    expect(quotes.map(({ bridgePayload }) => bridgePayload)).toEqual(['0x', ORBIT_PAYLOAD]);
  });

  it('sizes the Orbit bridge estimate to the targets with a positive incentive', async () => {
    mockChainState([{}], [[ZERO, OLAS, ZERO]]);

    await quoteChainClaims([[ARBITRUM], [[target(1), target(2), target(3)]]]);

    expect(mockGetArbitrumBridgePayload).toHaveBeenCalledWith([target(2)], ARBITRUM);
  });

  it('checkpoints each nominee before calculating its incentive with the processor decimals', async () => {
    mockChainState([{ bridgingDecimals: BigInt(8) }], [[OLAS, OLAS]]);

    await quoteChainClaims([[GNOSIS], [[target(1), target(2)]]]);

    const aggregate = mockSimulateContract.mock.calls.find(
      ([, { functionName }]) => functionName === 'aggregate3',
    );
    const calls = aggregate?.[1].args[0] as { callData: Hex }[];
    const decoded = calls.map(({ callData }) => {
      try {
        return decodeFunctionData({ abi: DISPENSER.abi, data: callData });
      } catch {
        return { functionName: 'checkpointNominee', args: [] };
      }
    });
    expect(decoded.map(({ functionName }) => functionName)).toEqual([
      'checkpointNominee',
      'calculateStakingIncentives',
      'checkpointNominee',
      'calculateStakingIncentives',
    ]);
    expect(decoded[1].args).toEqual([BigInt(1), BigInt(GNOSIS), target(1), BigInt(8)]);
    expect(aggregate?.[1].abi).toBe(multicall3Abi);
  });
});

describe('prepareClaim', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetArbitrumBridgePayload.mockResolvedValue({
      bridgePayload: ORBIT_PAYLOAD,
      messageCost: MESSAGE_COST,
      tokenCost: TOKEN_COST,
    });
  });

  it('simulates the exact batch with each chain value and their sum', async () => {
    mockChainState([{}, {}], [[OLAS], [ZERO]]);
    const batch: ClaimBatch = [
      [ARBITRUM, GNOSIS],
      [[target(1)], [target(2)]],
    ];

    await prepareClaim(batch, '0x00000000000000000000000000000000000000aa');

    const claim = mockSimulateContract.mock.calls.find(
      ([, { functionName }]) => functionName === 'claimStakingIncentivesBatch',
    )?.[1];
    expect(claim.args).toEqual([
      BigInt(1),
      [BigInt(ARBITRUM), BigInt(GNOSIS)],
      [[target(1)], [target(2)]],
      [ORBIT_PAYLOAD, '0x'],
      [MESSAGE_COST + TOKEN_COST, ZERO],
    ]);
    expect(claim.value).toBe(MESSAGE_COST + TOKEN_COST);
    expect(claim.account).toBe('0x00000000000000000000000000000000000000aa');
  });
});

describe('claim error classification', () => {
  const revert = new ContractFunctionExecutionError(
    new ContractFunctionRevertedError({
      abi: DISPENSER.abi,
      functionName: 'claimStakingIncentivesBatch',
      data: encodeErrorResult({
        abi: DISPENSER.abi,
        errorName: 'WrongAmount',
        args: [BigInt(1), ZERO],
      }),
    }),
    {
      abi: DISPENSER.abi,
      functionName: 'claimStakingIncentivesBatch',
      args: [BigInt(1), [], [], [], []],
    },
  );

  it('treats a contract revert as a revert, and an RPC failure as not one', () => {
    expect(isContractRevert(revert)).toBe(true);
    expect(isContractRevert(new HttpRequestError({ url: 'https://rpc.example' }))).toBe(false);
    expect(isContractRevert(new Error('network down'))).toBe(false);
  });

  it('tells a wallet rejection apart from other errors', () => {
    expect(toClaimError(new UserRejectedRequestError(new Error('denied')))).toEqual({
      kind: 'wallet-rejected',
    });
    expect(toClaimError(new Error('network down'))).toEqual({
      kind: 'other',
      message: 'network down',
    });
  });
});
