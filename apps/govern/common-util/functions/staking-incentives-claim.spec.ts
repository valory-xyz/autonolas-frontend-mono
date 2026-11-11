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
  parseAbi,
  zeroAddress,
} from 'viem';

import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { DISPENSER_ADDRESS, VOTE_WEIGHTING_ADDRESS } from 'common-util/constants/addresses';

import {
  type ClaimBatch,
  QuoteCallRevertedError,
  getUnclaimedReason,
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
const mockEstimateGas = jest.fn();
jest.mock('libs/util-functions/src/lib/estimateGasWithBuffer', () => ({
  estimateGasWithBuffer: (...args: unknown[]) => mockEstimateGas(...args),
}));

const mockGetArbitrumBridgePayload = jest.fn();
jest.mock('./arbitrum-bridge', () => ({
  isOrbitChainId: (chainId: number) => chainId === 42161 || chainId === 4663,
  getArbitrumBridgePayload: (...args: unknown[]) => mockGetArbitrumBridgePayload(...args),
}));

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';
const ARBITRUM = 42161;
const GNOSIS = 100;
const ORBIT_PAYLOAD = `0x${'ab'.repeat(160)}` as Hex;
const MESSAGE_COST = BigInt(700);
const TOKEN_COST = BigInt(300);
const ZERO = BigInt(0);
const OLAS = BigInt(10) ** BigInt(18);

const target = (n: number) => pad(`0x${n.toString(16)}`, { size: 32 }) as Address;
const processor = (i: number) => `0x${(i + 1).toString(16).padStart(40, '0')}` as Address;
const CHECKPOINT_ABI = parseAbi(['function checkpointNominee(bytes32 account, uint256 chainId)']);

type ChainSetup = { withheld?: bigint; bridgingDecimals?: bigint };

/**
 * Mocks the chain reads: per chain the processor and withheld amount, then bridging decimals,
 * then one aggregate3 call answering each target's calculateStakingIncentives with `incentives`.
 */
const mockChainState = (chains: ChainSetup[], incentives: bigint[][]) => {
  mockReadContracts
    .mockResolvedValueOnce(chains.flatMap(({ withheld = ZERO }, i) => [processor(i), withheld]))
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

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1), target(2)]]], ACCOUNT);

    expect(quote).toMatchObject({ sendsMessage: false, value: ZERO, bridgePayload: '0x' });
    expect(mockGetArbitrumBridgePayload).not.toHaveBeenCalled();
  });

  it('charges the message and token costs for a positive incentive bridged as fresh OLAS', async () => {
    mockChainState([{}], [[OLAS]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1)]]], ACCOUNT);

    expect(quote).toMatchObject({
      sendsMessage: true,
      value: MESSAGE_COST + TOKEN_COST,
      bridgePayload: ORBIT_PAYLOAD,
    });
  });

  it('still charges the message when withheld OLAS covers the whole incentive', async () => {
    mockChainState([{ withheld: OLAS * BigInt(2) }], [[OLAS]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1)]]], ACCOUNT);

    expect(quote).toMatchObject({ value: MESSAGE_COST });
  });

  it('charges the token cost when withheld OLAS covers only part of the incentive', async () => {
    mockChainState([{ withheld: OLAS / BigInt(2) }], [[OLAS]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1)]]], ACCOUNT);

    expect(quote.value).toBe(MESSAGE_COST + TOKEN_COST);
  });

  it('does not charge the token cost when withheld OLAS equals the incentive exactly', async () => {
    mockChainState([{ withheld: OLAS }], [[OLAS]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1)]]], ACCOUNT);

    expect(quote.value).toBe(MESSAGE_COST);
  });

  it('charges the token cost when targets each below the withheld amount exceed it together', async () => {
    mockChainState([{ withheld: OLAS }], [[(OLAS * BigInt(3)) / BigInt(4), OLAS / BigInt(2)]]);

    const [quote] = await quoteChainClaims([[ARBITRUM], [[target(1), target(2)]]], ACCOUNT);

    expect(quote.value).toBe(MESSAGE_COST + TOKEN_COST);
  });

  it('names the chain when the Dispenser has no deposit processor for it', async () => {
    mockReadContracts.mockResolvedValueOnce([zeroAddress, ZERO]);

    await expect(quoteChainClaims([[ARBITRUM], [[target(1)]]], ACCOUNT)).rejects.toThrow(
      'No deposit processor is registered on the Dispenser for chain 42161',
    );
    expect(mockReadContracts).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['the other chain', [ZERO, OLAS * BigInt(2)], MESSAGE_COST],
    ['this chain', [OLAS * BigInt(2), ZERO], MESSAGE_COST + TOKEN_COST],
  ])(
    'uses only the Orbit chain own withheld amount when %s has none',
    async (_case, [gnosisWithheld, arbitrumWithheld], expected) => {
      mockChainState(
        [{ withheld: gnosisWithheld }, { withheld: arbitrumWithheld }],
        [[OLAS], [OLAS]],
      );

      const quotes = await quoteChainClaims(
        [
          [GNOSIS, ARBITRUM],
          [[target(1)], [target(2)]],
        ],
        ACCOUNT,
      );

      expect(quotes[1].value).toBe(expected);
    },
  );

  it('passes the chain own deposit processor to the Orbit bridge estimate', async () => {
    mockChainState([{}, {}], [[OLAS], [OLAS]]);

    await quoteChainClaims(
      [
        [GNOSIS, ARBITRUM],
        [[target(1)], [target(2)]],
      ],
      ACCOUNT,
    );

    expect(mockGetArbitrumBridgePayload).toHaveBeenCalledWith([target(2)], ARBITRUM, processor(1));
  });

  it('names the quote call, target, chain and decoded revert when a sub-call reverts', async () => {
    mockChainState([{}], [[OLAS]]);
    mockSimulateContract.mockResolvedValue({
      result: [
        { success: true, returnData: '0x' },
        {
          success: false,
          returnData: encodeErrorResult({
            abi: DISPENSER.abi,
            errorName: 'WrongAmount',
            args: [BigInt(1), ZERO],
          }),
        },
      ],
    });

    const quote = quoteChainClaims([[GNOSIS], [[target(1)]]], ACCOUNT);

    await expect(quote).rejects.toBeInstanceOf(QuoteCallRevertedError);
    await expect(quote).rejects.toThrow(
      `calculateStakingIncentives reverted for staking target ${target(1)} on chain ${GNOSIS}: WrongAmount(1, 0)`,
    );
    const aggregate = mockSimulateContract.mock.calls[0][1];
    expect(aggregate.args[0].every((call: { allowFailure: boolean }) => call.allowFailure)).toBe(
      true,
    );
  });

  it('names the target and chain whose calculation reverted in a multi-chain batch', async () => {
    mockChainState([{}, {}], [[OLAS], [OLAS, OLAS]]);
    const ok = { success: true, returnData: '0x' };
    const calculated = {
      success: true,
      returnData: encodeFunctionResult({
        abi: DISPENSER.abi,
        functionName: 'calculateStakingIncentives',
        result: [OLAS, ZERO, BigInt(5), target(0), []],
      }),
    };
    mockSimulateContract.mockResolvedValue({
      result: [
        ok,
        calculated,
        ok,
        calculated,
        ok,
        {
          success: false,
          returnData: encodeErrorResult({ abi: DISPENSER.abi, errorName: 'Paused' }),
        },
      ],
    });

    await expect(
      quoteChainClaims(
        [
          [GNOSIS, ARBITRUM],
          [[target(1)], [target(2), target(3)]],
        ],
        ACCOUNT,
      ),
    ).rejects.toThrow(
      `calculateStakingIncentives reverted for staking target ${target(3)} on chain ${ARBITRUM}: Paused()`,
    );
  });

  it.each([
    [
      'an Error(string) as its reason',
      encodeErrorResult({
        abi: [{ type: 'error', name: 'Error', inputs: [{ name: 'message', type: 'string' }] }],
        errorName: 'Error',
        args: ['Paused'],
      }),
      'Paused',
    ],
    ['an unknown selector as the raw data', '0xdeadbeef' as Hex, '0xdeadbeef'],
  ])('reports a reverted quote call with %s', async (_, returnData, reason) => {
    mockChainState([{}], [[OLAS]]);
    mockSimulateContract.mockResolvedValue({
      result: [
        { success: false, returnData },
        { success: true, returnData: '0x' },
      ],
    });

    await expect(quoteChainClaims([[GNOSIS], [[target(1)]]], ACCOUNT)).rejects.toThrow(
      `checkpointNominee reverted for staking target ${target(1)} on chain ${GNOSIS}: ${reason}`,
    );
  });

  it('names a failed checkpoint with no revert data', async () => {
    mockChainState([{}], [[OLAS]]);
    mockSimulateContract.mockResolvedValue({
      result: [
        { success: false, returnData: '0x' },
        { success: true, returnData: '0x' },
      ],
    });

    await expect(quoteChainClaims([[GNOSIS], [[target(1)]]], ACCOUNT)).rejects.toThrow(
      `checkpointNominee reverted for staking target ${target(1)} on chain ${GNOSIS}: no revert data`,
    );
  });

  it('names the failed checkpoint when both of a target sub-calls fail', async () => {
    mockChainState([{}], [[OLAS]]);
    const wrongAmount = encodeErrorResult({
      abi: DISPENSER.abi,
      errorName: 'WrongAmount',
      args: [BigInt(1), ZERO],
    });
    mockSimulateContract.mockResolvedValue({
      result: [
        { success: false, returnData: '0x' },
        { success: false, returnData: wrongAmount },
      ],
    });

    await expect(quoteChainClaims([[GNOSIS], [[target(1)]]], ACCOUNT)).rejects.toThrow(
      `checkpointNominee reverted for staking target ${target(1)} on chain ${GNOSIS}: no revert data`,
    );
  });

  it('names the chain whose bridge quote failed', async () => {
    mockChainState([{}], [[OLAS]]);
    const cause = new Error('could not detect network');
    mockGetArbitrumBridgePayload.mockRejectedValue(cause);

    const quote = quoteChainClaims([[ARBITRUM], [[target(1)]]], ACCOUNT);

    await expect(quote).rejects.toThrow(
      `Could not quote the bridge for chain ${ARBITRUM}: could not detect network`,
    );
    await expect(quote).rejects.toMatchObject({ cause });
  });

  it('keeps one chain fee and zero for the others in a mixed batch', async () => {
    mockChainState([{}, {}], [[OLAS], [OLAS]]);

    const quotes = await quoteChainClaims(
      [
        [GNOSIS, ARBITRUM],
        [[target(1)], [target(2)]],
      ],
      ACCOUNT,
    );

    expect(quotes.map(({ value }) => value)).toEqual([ZERO, MESSAGE_COST + TOKEN_COST]);
    expect(quotes.map(({ bridgePayload }) => bridgePayload)).toEqual(['0x', ORBIT_PAYLOAD]);
  });

  it('sizes the Orbit bridge estimate to the targets with a positive incentive', async () => {
    mockChainState([{}], [[ZERO, OLAS, ZERO]]);

    await quoteChainClaims([[ARBITRUM], [[target(1), target(2), target(3)]]], ACCOUNT);

    expect(mockGetArbitrumBridgePayload).toHaveBeenCalledWith([target(2)], ARBITRUM, processor(0));
  });

  it('checkpoints each nominee before calculating its incentive with the processor decimals', async () => {
    mockChainState([{ bridgingDecimals: BigInt(8) }], [[OLAS, OLAS]]);

    await quoteChainClaims([[GNOSIS], [[target(1), target(2)]]], ACCOUNT);

    const aggregate = mockSimulateContract.mock.calls.find(
      ([, { functionName }]) => functionName === 'aggregate3',
    );
    const calls = aggregate?.[1].args[0] as { target: Address; callData: Hex }[];
    expect(calls.map((call) => call.target)).toEqual([
      VOTE_WEIGHTING_ADDRESS,
      DISPENSER_ADDRESS,
      VOTE_WEIGHTING_ADDRESS,
      DISPENSER_ADDRESS,
    ]);
    const checkpoints = [calls[0], calls[2]].map(({ callData }) =>
      decodeFunctionData({ abi: CHECKPOINT_ABI, data: callData }),
    );
    expect(checkpoints).toEqual([
      { functionName: 'checkpointNominee', args: [target(1), BigInt(GNOSIS)] },
      { functionName: 'checkpointNominee', args: [target(2), BigInt(GNOSIS)] },
    ]);
    const calculations = [calls[1], calls[3]].map(({ callData }) =>
      decodeFunctionData({ abi: DISPENSER.abi, data: callData }),
    );
    expect(calculations.map(({ functionName }) => functionName)).toEqual([
      'calculateStakingIncentives',
      'calculateStakingIncentives',
    ]);
    expect(calculations[0].args).toEqual([BigInt(1), BigInt(GNOSIS), target(1), BigInt(8)]);
    expect(calculations[1].args).toEqual([BigInt(1), BigInt(GNOSIS), target(2), BigInt(8)]);
    expect(aggregate?.[1].abi).toBe(multicall3Abi);
    expect(aggregate?.[1].account).toBe(ACCOUNT);
  });

  it('reads each chain processor and withheld amount, then the decimals from that processor', async () => {
    mockChainState([{}, {}], [[OLAS], [OLAS]]);

    await quoteChainClaims(
      [
        [GNOSIS, ARBITRUM],
        [[target(1)], [target(2)]],
      ],
      ACCOUNT,
    );

    const [dispenserReads, decimalsReads] = mockReadContracts.mock.calls.map(
      ([, { contracts }]) =>
        contracts as { address: Address; functionName: string; args?: unknown[] }[],
    );
    expect(
      dispenserReads.map(({ address, functionName, args }) => [address, functionName, args]),
    ).toEqual([
      [DISPENSER_ADDRESS, 'mapChainIdDepositProcessors', [BigInt(GNOSIS)]],
      [DISPENSER_ADDRESS, 'mapChainIdWithheldAmounts', [BigInt(GNOSIS)]],
      [DISPENSER_ADDRESS, 'mapChainIdDepositProcessors', [BigInt(ARBITRUM)]],
      [DISPENSER_ADDRESS, 'mapChainIdWithheldAmounts', [BigInt(ARBITRUM)]],
    ]);
    expect(decimalsReads.map(({ address, functionName }) => [address, functionName])).toEqual([
      [processor(0), 'getBridgingDecimals'],
      [processor(1), 'getBridgingDecimals'],
    ]);
    // Raw values, not { status, result }: a failed read throws instead of passing through.
    expect(mockReadContracts.mock.calls.map(([, params]) => params.allowFailure)).toEqual([
      false,
      false,
    ]);
  });

  it('calculates each chain incentive with that chain own bridging decimals', async () => {
    mockChainState(
      [{ bridgingDecimals: BigInt(8) }, { bridgingDecimals: BigInt(18) }],
      [[OLAS], [OLAS]],
    );

    await quoteChainClaims(
      [
        [GNOSIS, ARBITRUM],
        [[target(1)], [target(2)]],
      ],
      ACCOUNT,
    );

    const aggregate = mockSimulateContract.mock.calls.find(
      ([, { functionName }]) => functionName === 'aggregate3',
    );
    const calls = aggregate?.[1].args[0] as { callData: Hex }[];
    const decimals = [calls[1], calls[3]].map(
      ({ callData }) => decodeFunctionData({ abi: DISPENSER.abi, data: callData }).args?.[3],
    );
    expect(decimals).toEqual([BigInt(8), BigInt(18)]);
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

    const prepared = await prepareClaim(batch, ACCOUNT);

    expect(prepared.batch).toEqual(batch);
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
    expect(claim.account).toBe(ACCOUNT);
  });

  it('attaches the sum of two Orbit chains values, each in batch order', async () => {
    const ROBINHOOD = 4663;
    // Arbitrum is covered by withheld OLAS (message only); Robinhood bridges fresh OLAS.
    mockChainState([{ withheld: OLAS * BigInt(2) }, {}], [[OLAS], [OLAS]]);
    const batch: ClaimBatch = [
      [ARBITRUM, ROBINHOOD],
      [[target(1)], [target(2)]],
    ];

    await prepareClaim(batch, ACCOUNT);

    const claim = mockSimulateContract.mock.calls.find(
      ([, { functionName }]) => functionName === 'claimStakingIncentivesBatch',
    )?.[1];
    expect(claim.args[4]).toEqual([MESSAGE_COST, MESSAGE_COST + TOKEN_COST]);
    expect(claim.value).toBe(MESSAGE_COST * BigInt(2) + TOKEN_COST);
  });

  it('sizes the gas of the exact simulated claim and returns it on the request', async () => {
    mockChainState([{}], [[OLAS]]);
    mockEstimateGas.mockResolvedValue(BigInt(123));

    const { request } = await prepareClaim([[GNOSIS], [[target(1)]]], ACCOUNT);

    const simulated = mockSimulateContract.mock.calls.find(
      ([, { functionName }]) => functionName === 'claimStakingIncentivesBatch',
    )?.[1];
    expect(mockEstimateGas).toHaveBeenCalledWith({}, simulated);
    expect(request).toEqual({ functionName: 'claimStakingIncentivesBatch', gas: BigInt(123) });
  });

  it('rejects when the gas estimate reverts, so the claim gets the rebuild handling', async () => {
    mockChainState([{}], [[OLAS]]);
    const revert = new Error('estimate reverted');
    mockEstimateGas.mockRejectedValue(revert);

    await expect(prepareClaim([[GNOSIS], [[target(1)]]], ACCOUNT)).rejects.toBe(revert);
  });
});

describe('getUnclaimedReason', () => {
  it.each([
    [{ status: 'success' as const }, undefined, null],
    [{ status: 'success' as const }, 'repriced' as const, null],
    [{ status: 'reverted' as const }, undefined, { kind: 'reverted-after-simulation' }],
    [{ status: 'success' as const }, 'replaced' as const, { kind: 'reverted-after-simulation' }],
    [{ status: 'success' as const }, 'cancelled' as const, { kind: 'wallet-rejected' }],
  ])('maps a %o receipt replaced as %s to %o', (receipt, reason, expected) => {
    expect(getUnclaimedReason(receipt, reason)).toEqual(expected);
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
    expect(
      isContractRevert(new QuoteCallRevertedError('checkpointNominee', target(1), 1, 'x')),
    ).toBe(true);
    expect(isContractRevert(new HttpRequestError({ url: 'https://rpc.example' }))).toBe(false);
    expect(isContractRevert(new Error('network down'))).toBe(false);
  });

  it('tells a wallet rejection apart from other errors', () => {
    // wagmi throws the rejection wrapped, the same way it wraps a revert.
    const rejection = new ContractFunctionExecutionError(
      new UserRejectedRequestError(new Error('denied')),
      {
        abi: DISPENSER.abi,
        functionName: 'claimStakingIncentivesBatch',
        args: [BigInt(1), [], [], [], []],
      },
    );
    expect(toClaimError(rejection)).toEqual({ kind: 'wallet-rejected' });
    expect(toClaimError(new Error('network down'))).toEqual({
      kind: 'other',
      message: 'network down',
    });
  });

  it('names the decoded revert in the message of an unrelated contract revert', () => {
    expect(toClaimError(revert)).toEqual({
      kind: 'other',
      message: expect.stringContaining('WrongAmount(1, 0)'),
    });
  });

  it.each([
    ['an Error(string)', 'Error', 'string', 'Paused', 'Paused'],
    ['a Panic', 'Panic', 'uint256', BigInt(17), 'overflow'],
  ])('does not repeat the reason of %s revert', (_, errorName, inputType, arg, reason) => {
    const builtinRevert = new ContractFunctionExecutionError(
      new ContractFunctionRevertedError({
        abi: DISPENSER.abi,
        functionName: 'claimStakingIncentivesBatch',
        data: encodeErrorResult({
          abi: [{ type: 'error', name: errorName, inputs: [{ name: 'value', type: inputType }] }],
          errorName,
          args: [arg],
        }),
      }),
      {
        abi: DISPENSER.abi,
        functionName: 'claimStakingIncentivesBatch',
        args: [BigInt(1), [], [], [], []],
      },
    );

    const error = toClaimError(builtinRevert);

    expect(error).toEqual({ kind: 'other', message: builtinRevert.shortMessage });
    expect(builtinRevert.shortMessage).toContain(reason);
  });

  it('falls back to the short message, the error message, or a generic one', () => {
    const rpcError = new HttpRequestError({ url: 'https://rpc.example' });
    expect(toClaimError(rpcError)).toEqual({ kind: 'other', message: rpcError.shortMessage });
    expect(toClaimError('boom')).toEqual({ kind: 'other', message: 'Unknown error' });
  });
});
