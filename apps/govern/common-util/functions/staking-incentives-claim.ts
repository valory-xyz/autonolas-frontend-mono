import { readContracts, simulateContract } from '@wagmi/core';
import {
  type Address,
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  decodeFunctionResult,
  encodeFunctionData,
  multicall3Abi,
  parseAbi,
} from 'viem';
import { mainnet } from 'viem/chains';

import { DISPENSER, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { wagmiConfig } from 'common-util/config/wagmi';

import { getArbitrumBridgePayload, isOrbitChainId } from './arbitrum-bridge';

/** `[chainIds, stakingTargets per chain]`; targets are bytes32-padded nominee accounts. */
export type ClaimBatch = [number[], Address[][]];

export type ChainClaimQuote = {
  chainId: number;
  targets: `0x${string}`[];
  /** Checkpoint-aware, rounded to the processor's bridging decimals. */
  incentives: bigint[];
  /** Some incentive is positive, so the Dispenser sends this chain a message. */
  sendsMessage: boolean;
  /** 0 unless an Orbit chain (Arbitrum, Robinhood) with `sendsMessage`. */
  value: bigint;
  bridgePayload: `0x${string}`;
};

export type ClaimError =
  | { kind: 'claims-changed' }
  | { kind: 'nothing-to-claim' }
  | { kind: 'wallet-rejected' }
  | { kind: 'reverted-after-simulation' }
  | { kind: 'other'; message: string };

const MAINNET_CHAIN_ID: number = mainnet.id;
// Each batch claims one epoch per target; a target owed more epochs appears in later batches.
const NUM_CLAIMED_EPOCHS = BigInt(1);
const MULTICALL3_ADDRESS = mainnet.contracts.multicall3.address;
const DISPENSER_ADDRESS = DISPENSER.addresses[mainnet.id];
const VOTE_WEIGHTING_ADDRESS = (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id];
const VOTE_WEIGHTING_ABI = parseAbi([
  'function checkpointNominee(bytes32 account, uint256 chainId)',
]);
const DEPOSIT_PROCESSOR_ABI = parseAbi(['function getBridgingDecimals() view returns (uint256)']);

type ChainState = { bridgingDecimals: bigint; withheldAmount: bigint };

const readChainStates = async (chainIds: number[]): Promise<ChainState[]> => {
  const dispenserReads = await readContracts(wagmiConfig, {
    allowFailure: false,
    contracts: chainIds.flatMap((chainId) => [
      {
        address: DISPENSER_ADDRESS,
        abi: DISPENSER.abi,
        chainId: MAINNET_CHAIN_ID,
        functionName: 'mapChainIdDepositProcessors' as const,
        args: [BigInt(chainId)] as const,
      },
      {
        address: DISPENSER_ADDRESS,
        abi: DISPENSER.abi,
        chainId: MAINNET_CHAIN_ID,
        functionName: 'mapChainIdWithheldAmounts' as const,
        args: [BigInt(chainId)] as const,
      },
    ]),
  });
  const processors = chainIds.map((_, i) => dispenserReads[2 * i] as Address);
  const withheldAmounts = chainIds.map((_, i) => dispenserReads[2 * i + 1] as bigint);

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
        allowFailure: false,
        callData: encodeFunctionData({
          abi: VOTE_WEIGHTING_ABI,
          functionName: 'checkpointNominee',
          args: [target, BigInt(chainId)],
        }),
      },
      {
        target: DISPENSER_ADDRESS,
        allowFailure: false,
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

  let callIndex = 0;
  return stakingTargets.map((targets) =>
    targets.map(() => {
      // Skip the checkpoint result; the calculation follows it.
      const { returnData } = result[callIndex + 1];
      callIndex += 2;
      const [totalStakingIncentive] = decodeFunctionResult({
        abi: DISPENSER.abi,
        functionName: 'calculateStakingIncentives',
        data: returnData,
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
        sendsMessage: sendingTargets.length > 0,
        value: BigInt(0),
        bridgePayload: '0x',
      };
      if (!quote.sendsMessage || !isOrbitChainId(chainId)) return quote;

      const { bridgePayload, messageCost, tokenCost } = await getArbitrumBridgePayload(
        sendingTargets,
        chainId,
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

/** Quotes the batch and simulates the exact claim the wallet will be asked to sign. */
export const prepareClaim = async (batch: ClaimBatch, account: Address) => {
  const quotes = await quoteChainClaims(batch, account);
  const params = {
    address: DISPENSER_ADDRESS,
    abi: DISPENSER.abi,
    chainId: MAINNET_CHAIN_ID,
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
  return { quotes, params, request };
};

const findInChain = <T extends Error>(error: unknown, type: new (...args: never[]) => T) =>
  error instanceof BaseError ? error.walk((cause) => cause instanceof type) : null;

/** A contract revert, as opposed to an RPC, network or wallet failure. */
export const isContractRevert = (error: unknown) =>
  findInChain(error, ContractFunctionRevertedError) !== null;

export const toClaimError = (error: unknown): ClaimError => {
  if (findInChain(error, UserRejectedRequestError) !== null) return { kind: 'wallet-rejected' };
  if (error instanceof BaseError) return { kind: 'other', message: error.shortMessage };
  if (error instanceof Error) return { kind: 'other', message: error.message };
  return { kind: 'other', message: 'Unknown error' };
};
