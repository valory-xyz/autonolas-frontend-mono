import { readContracts, simulateContract } from '@wagmi/core';
import {
  type Address,
  type Hex,
  type ReplacementReason,
  type TransactionReceipt,
  UserRejectedRequestError,
  decodeErrorResult,
  decodeFunctionResult,
  encodeFunctionData,
  multicall3Abi,
  parseAbi,
  zeroAddress,
} from 'viem';
import { mainnet } from 'viem/chains';

import { DISPENSER, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import {
  errorMessage,
  findContractRevert,
  findInChain,
  formatRevert,
} from 'libs/util-functions/src';
import { estimateGasWithBuffer } from 'libs/util-functions/src/lib/estimateGasWithBuffer';

import { MAINNET_CHAIN_ID } from 'common-util/constants/chains';
import { wagmiConfig } from 'common-util/config/wagmi';

import { getArbitrumBridgePayload, isOrbitChainId } from './arbitrum-bridge';

/** `[chainIds, stakingTargets per chain]`; targets are bytes32-padded nominee accounts. */
export type ClaimBatch = [number[], Address[][]];

export type ChainClaimQuote = {
  chainId: number;
  targets: `0x${string}`[];
  /** Checkpoint-aware, rounded to the processor's bridging decimals. */
  incentives: bigint[];
  /** ETH attached for this chain; see `quoteChainClaims` for when it is non-zero. */
  value: bigint;
  bridgePayload: `0x${string}`;
};

export type ClaimError =
  | { kind: 'claims-changed' }
  | { kind: 'nothing-to-claim' }
  | { kind: 'wallet-rejected' }
  | { kind: 'reverted-after-simulation' }
  | { kind: 'other'; message: string };

// Each batch claims one epoch per target; a target owed more epochs appears in later batches.
const NUM_CLAIMED_EPOCHS = BigInt(1);
const MULTICALL3_ADDRESS = mainnet.contracts.multicall3.address;
const DISPENSER_ADDRESS = DISPENSER.addresses[mainnet.id];
const VOTE_WEIGHTING_ADDRESS = (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id];
const DEPOSIT_PROCESSOR_ABI = parseAbi(['function getBridgingDecimals() view returns (uint256)']);
const dispenserParams = {
  address: DISPENSER_ADDRESS,
  abi: DISPENSER.abi,
  chainId: MAINNET_CHAIN_ID,
} as const;

type ChainState = { processor: Address; bridgingDecimals: bigint; withheldAmount: bigint };

/**
 * A quote sub-call reverted. Multicall3 would hide the reason behind "Multicall3: call failed",
 * so the call is named with its decoded revert.
 */
export class QuoteCallRevertedError extends Error {
  constructor(functionName: string, target: Address, chainId: number, reason: string) {
    super(`${functionName} reverted for staking target ${target} on chain ${chainId}: ${reason}`);
    this.name = 'QuoteCallRevertedError';
  }
}

const decodeCallRevert = (abi: Parameters<typeof decodeErrorResult>[0]['abi'], data: Hex) => {
  if (data === '0x') return 'no revert data';
  try {
    return formatRevert(decodeErrorResult({ abi, data }));
  } catch {
    return data;
  }
};

const readChainStates = async (chainIds: number[]): Promise<ChainState[]> => {
  const dispenserReads = await readContracts(wagmiConfig, {
    allowFailure: false,
    contracts: chainIds.flatMap((chainId) => [
      {
        ...dispenserParams,
        functionName: 'mapChainIdDepositProcessors' as const,
        args: [BigInt(chainId)] as const,
      },
      {
        ...dispenserParams,
        functionName: 'mapChainIdWithheldAmounts' as const,
        args: [BigInt(chainId)] as const,
      },
    ]),
  });
  const processors = chainIds.map((_, i) => dispenserReads[2 * i] as Address);
  const withheldAmounts = chainIds.map((_, i) => dispenserReads[2 * i + 1] as bigint);
  // Reading the zero address returns no data, which would hide that governance has not wired it.
  processors.forEach((processor, i) => {
    if (processor === zeroAddress) {
      throw new Error(
        `No deposit processor is registered on the Dispenser for chain ${chainIds[i]}`,
      );
    }
  });

  const bridgingDecimals = await readContracts(wagmiConfig, {
    allowFailure: false,
    contracts: processors.map((processor) => ({
      address: processor,
      abi: DEPOSIT_PROCESSOR_ABI,
      chainId: MAINNET_CHAIN_ID,
      functionName: 'getBridgingDecimals' as const,
    })),
  });

  return chainIds.map((_, i) => ({
    processor: processors[i],
    bridgingDecimals: bridgingDecimals[i] as bigint,
    withheldAmount: withheldAmounts[i],
  }));
};

/**
 * Reads every target's incentive exactly as the claim will compute it: one Multicall3 `eth_call`
 * checkpoints each nominee in VoteWeighting and then calls `Dispenser.calculateStakingIncentives`,
 * in the order the Dispenser does, so the checkpoints are visible to the calculations.
 */
const readIncentives = async (
  [chainIds, stakingTargets]: ClaimBatch,
  states: ChainState[],
  account: Address,
): Promise<bigint[][]> => {
  const calls = chainIds.flatMap((chainId, i) =>
    stakingTargets[i].flatMap((target) => [
      {
        target: VOTE_WEIGHTING_ADDRESS,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: VOTE_WEIGHTING.abi,
          functionName: 'checkpointNominee',
          args: [target, BigInt(chainId)],
        }),
      },
      {
        target: DISPENSER_ADDRESS,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: DISPENSER.abi,
          functionName: 'calculateStakingIncentives',
          args: [NUM_CLAIMED_EPOCHS, BigInt(chainId), target, states[i].bridgingDecimals],
        }),
      },
    ]),
  );

  const { result } = await simulateContract(wagmiConfig, {
    address: MULTICALL3_ADDRESS,
    abi: multicall3Abi,
    chainId: MAINNET_CHAIN_ID,
    functionName: 'aggregate3',
    args: [calls],
    account,
  });

  const callResults: readonly { success: boolean; returnData: Hex }[] = result;
  let callIndex = 0;
  return stakingTargets.map((targets, i) =>
    targets.map((target) => {
      const checkpoint = callResults[callIndex];
      const calculation = callResults[callIndex + 1];
      callIndex += 2;
      if (!checkpoint.success) {
        const reason = decodeCallRevert(VOTE_WEIGHTING.abi, checkpoint.returnData);
        throw new QuoteCallRevertedError('checkpointNominee', target, chainIds[i], reason);
      }
      if (!calculation.success) {
        const reason = decodeCallRevert(DISPENSER.abi, calculation.returnData);
        throw new QuoteCallRevertedError('calculateStakingIncentives', target, chainIds[i], reason);
      }
      const [totalStakingIncentive] = decodeFunctionResult({
        abi: DISPENSER.abi,
        functionName: 'calculateStakingIncentives',
        data: calculation.returnData,
      });
      return totalStakingIncentive;
    }),
  );
};

/** OLAS the Dispenser bridges for a chain once withheld OLAS has covered what it can. */
const getTransferAmount = (incentives: bigint[], withheldAmount: bigint) => {
  const total = incentives.reduce((sum, incentive) => sum + incentive, BigInt(0));
  return total > withheldAmount ? total - withheldAmount : BigInt(0);
};

/**
 * Quotes each chain of a batch. The Dispenser reverts with `WrongAmount(value, 0)` for a chain
 * that sends no message, so only Orbit chains with a positive incentive attach value: the message
 * cost always, and the token cost only when fresh OLAS is bridged.
 */
export const quoteChainClaims = async (
  batch: ClaimBatch,
  account: Address,
): Promise<ChainClaimQuote[]> => {
  const [chainIds, stakingTargets] = batch;
  const states = await readChainStates(chainIds);
  const incentives = await readIncentives(batch, states, account);

  return Promise.all(
    chainIds.map(async (chainId, i) => {
      const targets = stakingTargets[i];
      const sendingTargets = targets.filter((_, j) => incentives[i][j] > BigInt(0));
      const quote: ChainClaimQuote = {
        chainId,
        targets,
        incentives: incentives[i],
        value: BigInt(0),
        bridgePayload: '0x',
      };
      // A positive incentive is what makes the Dispenser send this chain a message.
      const sendsMessage = sendingTargets.length > 0;
      if (!sendsMessage || !isOrbitChainId(chainId)) return quote;

      const { bridgePayload, messageCost, tokenCost } = await getArbitrumBridgePayload(
        sendingTargets,
        chainId,
        states[i].processor,
      );
      const sendsTokens = getTransferAmount(incentives[i], states[i].withheldAmount) > BigInt(0);
      return {
        ...quote,
        bridgePayload,
        value: messageCost + (sendsTokens ? tokenCost : BigInt(0)),
      };
    }),
  );
};

/**
 * Quotes the batch, simulates the exact claim the wallet will be asked to sign, and sizes its gas.
 * The estimate runs the claim again, so a claim that moved meanwhile reverts here too. Returns
 * the batch it simulated, which is the one a confirmed claim records.
 */
export const prepareClaim = async (batch: ClaimBatch, account: Address) => {
  const quotes = await quoteChainClaims(batch, account);
  const params = {
    ...dispenserParams,
    functionName: 'claimStakingIncentivesBatch' as const,
    args: [
      NUM_CLAIMED_EPOCHS,
      quotes.map(({ chainId }) => BigInt(chainId)),
      quotes.map(({ targets }) => targets),
      quotes.map(({ bridgePayload }) => bridgePayload),
      quotes.map(({ value }) => value),
    ] as const,
    value: quotes.reduce((sum, { value }) => sum + value, BigInt(0)),
    account,
  };
  const { request } = await simulateContract(wagmiConfig, params);
  const gas = await estimateGasWithBuffer(wagmiConfig, params);
  const simulatedBatch: ClaimBatch = [
    quotes.map(({ chainId }) => chainId),
    quotes.map(({ targets }) => targets),
  ];
  return { quotes, batch: simulatedBatch, request: { ...request, gas } };
};

/** A contract revert, as opposed to an RPC, network or wallet failure. */
export const isContractRevert = (error: unknown) =>
  error instanceof QuoteCallRevertedError || findContractRevert(error) !== null;

/** The decoded custom revert, e.g. `WrongAmount(1, 0)`, so an unrelated revert says what failed. */
const getRevertReason = (error: unknown) => {
  const revert = findContractRevert(error);
  // viem's shortMessage already carries `reason`, set for an Error(string) or a Panic.
  if (!revert?.data || revert.reason) return null;
  return formatRevert(revert.data);
};

/** A mined claim's outcome: `null` when it claimed, else why it did not. */
export const getUnclaimedReason = (
  receipt: Pick<TransactionReceipt, 'status'>,
  replacedReason?: ReplacementReason,
): ClaimError | null => {
  if (replacedReason === 'cancelled') return { kind: 'wallet-rejected' };
  if (replacedReason === 'replaced' || receipt.status === 'reverted') {
    return { kind: 'reverted-after-simulation' };
  }
  return null;
};

export const toClaimError = (error: unknown): ClaimError => {
  if (findInChain(error, UserRejectedRequestError) !== null) return { kind: 'wallet-rejected' };
  const revertReason = getRevertReason(error);
  const message = errorMessage(error);
  return { kind: 'other', message: revertReason ? `${message} ${revertReason}` : message };
};
