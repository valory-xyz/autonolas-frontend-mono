import { ParentToChildMessageGasEstimator } from '@arbitrum/sdk';
import { ethers as ethersV5 } from 'ethers-v5';
import { type Address, encodeAbiParameters, parseAbiParameters } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';

import { RPC_URLS } from 'libs/util-constants/src';
import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const ARBITRUM_CHAIN_ID = arbitrum.id;

/**
 * Cached ethers v5 providers — required because @arbitrum/sdk v4 only accepts ethers v5 providers.
 * Once the SDK adds viem support, these can be removed in favor of viem's publicClient.
 */
let l1ProviderInstance: ethersV5.providers.JsonRpcProvider | null = null;
let l2ProviderInstance: ethersV5.providers.JsonRpcProvider | null = null;

const getL1Provider = () =>
  (l1ProviderInstance ??= new ethersV5.providers.JsonRpcProvider(RPC_URLS[mainnet.id]));
const getL2Provider = () =>
  (l2ProviderInstance ??= new ethersV5.providers.JsonRpcProvider(RPC_URLS[ARBITRUM_CHAIN_ID]));

const getL1BaseFee = async (provider: ethersV5.providers.JsonRpcProvider) => {
  const block = await provider.getBlock('latest');
  if (!block.baseFeePerGas) {
    throw new Error('Latest block did not contain base fee (EIP-1559 required)');
  }
  return block.baseFeePerGas;
};

/**
 * Aliased address of the L1 Timelock on Arbitrum, used as the refund account
 * for excess gas fees on L2 retryable tickets.
 * Source: https://github.com/valory-xyz/autonolas-tokenomics/blob/main/scripts/deployment/staking/arbitrum/globals_arbitrum_mainnet.json
 */
const ARBITRUM_BRIDGE_MEDIATOR: Address = '0x4d30F68F5AA342d296d4deE4bB1Cacca912dA70F';

/**
 * TOKEN_GAS_LIMIT from DefaultDepositProcessorL1 contract.
 * This is the gas limit for the token bridge transfer on L2.
 */
const TOKEN_GAS_LIMIT = 300_000;

/**
 * Gas estimation overrides with 30% buffers for safety.
 * Minimum gasLimit set to 2M to meet contract's MESSAGE_GAS_LIMIT requirement.
 */
const GAS_OVERRIDES = {
  gasLimit: {
    base: undefined,
    min: ethersV5.BigNumber.from(2_000_000),
    percentIncrease: ethersV5.BigNumber.from(30),
  },
  maxSubmissionFee: {
    base: undefined,
    percentIncrease: ethersV5.BigNumber.from(30),
  },
  maxFeePerGas: {
    base: undefined,
    percentIncrease: ethersV5.BigNumber.from(30),
  },
};

/** Extra buffer added to gas limit for message execution */
const GAS_LIMIT_BUFFER = 100_000;

export type ArbitrumBridgeParams = {
  bridgePayload: `0x${string}`;
  value: bigint;
};

/**
 * Computes the Arbitrum bridge payload and required ETH value for L1->L2 message passing.
 *
 * The bridge payload encodes 5 values expected by ArbitrumDepositProcessorL1._sendMessage:
 *   (refundAddress, gasPriceBid, maxSubmissionCostToken, gasLimitMessage, maxSubmissionCostMessage)
 *
 * The value is the total cost: token transfer cost + message transfer cost.
 */
export const getArbitrumBridgePayload = async (
  stakingTargets: Address[],
): Promise<ArbitrumBridgeParams> => {
  const l1Provider = getL1Provider();
  const l2Provider = getL2Provider();

  // Read ArbitrumDepositProcessorL1 address from Dispenser contract
  const dispenserContract = new ethersV5.Contract(
    DISPENSER.addresses[mainnet.id],
    ['function mapChainIdDepositProcessors(uint256) view returns (address)'],
    l1Provider,
  );

  // Fetch deposit processor address and L1 base fee in parallel (independent calls)
  const [l1DepositProcessorAddress, l1BaseFee] = await Promise.all([
    dispenserContract.mapChainIdDepositProcessors(ARBITRUM_CHAIN_ID) as Promise<string>,
    getL1BaseFee(l1Provider),
  ]);

  // Read l2TargetDispenser from the ArbitrumDepositProcessorL1 contract
  const depositProcessorContract = new ethersV5.Contract(
    l1DepositProcessorAddress,
    ['function l2TargetDispenser() view returns (address)'],
    l1Provider,
  );
  const l2TargetDispenserAddress: string = await depositProcessorContract.l2TargetDispenser();

  // Construct approximate message calldata for gas estimation.
  // The contract sends: abi.encodeWithSelector(RECEIVE_MESSAGE, abi.encode(targets, stakingIncentives, batchHash))
  // We use dummy values since only the calldata size matters for gas estimation.
  // Note: stakingTargets may be bytes32-padded, so we use dummy addresses of the same length.
  const dummyTargets = stakingTargets.map(() => ARBITRUM_BRIDGE_MEDIATOR);
  const dummyAmounts = stakingTargets.map(() => ethersV5.BigNumber.from(100));
  const dummyBatchHash = ethersV5.constants.HashZero;
  const innerData = ethersV5.utils.defaultAbiCoder.encode(
    ['address[]', 'uint256[]', 'bytes32'],
    [dummyTargets, dummyAmounts, dummyBatchHash],
  );
  const receiveMessageIface = new ethersV5.utils.Interface([
    'function receiveMessage(bytes memory data)',
  ]);
  const messageCalldata = receiveMessageIface.encodeFunctionData('receiveMessage', [innerData]);

  // Estimate gas parameters for the L1->L2 message
  const gasEstimator = new ParentToChildMessageGasEstimator(l2Provider);
  const gasParams = await gasEstimator.estimateAll(
    {
      from: l1DepositProcessorAddress,
      to: l2TargetDispenserAddress,
      l2CallValue: ethersV5.BigNumber.from(0),
      excessFeeRefundAddress: ARBITRUM_BRIDGE_MEDIATOR,
      callValueRefundAddress: ARBITRUM_BRIDGE_MEDIATOR,
      data: messageCalldata,
    },
    l1BaseFee,
    l1Provider,
    GAS_OVERRIDES,
  );

  const gasPriceBid = gasParams.maxFeePerGas;
  const gasLimitMessage = gasParams.gasLimit.add(GAS_LIMIT_BUFFER);
  const maxSubmissionCostMessage = gasParams.maxSubmissionCost;

  // Estimate token submission cost based on token bridge calldata size.
  // Uses finalizeInboundTransfer calldata structure for size estimation.
  const tokenIface = new ethersV5.utils.Interface([
    'function finalizeInboundTransfer(address, address, address, uint256, bytes)',
  ]);
  // ABI-encoded words (maxSubmissionCost, extraData offset, extraData length=0)
  const dummyTokenData =
    '0x' +
    '000000000000000000000000000000000000000000000000000005f775d57880' +
    '0000000000000000000000000000000000000000000000000000000000000040' +
    '0000000000000000000000000000000000000000000000000000000000000000';
  const tokenCalldata = tokenIface.encodeFunctionData('finalizeInboundTransfer', [
    ARBITRUM_BRIDGE_MEDIATOR,
    ARBITRUM_BRIDGE_MEDIATOR,
    ARBITRUM_BRIDGE_MEDIATOR,
    100,
    dummyTokenData,
  ]);
  const maxSubmissionCostToken = await gasEstimator.estimateSubmissionFee(
    l1Provider,
    l1BaseFee,
    ethersV5.utils.hexDataLength(tokenCalldata),
  );

  // Calculate total cost:
  // cost[0] = maxSubmissionCostToken + TOKEN_GAS_LIMIT * gasPriceBid (token transfer)
  // cost[1] = maxSubmissionCostMessage + gasLimitMessage * gasPriceBid (message)
  const tokenCost = maxSubmissionCostToken.add(gasPriceBid.mul(TOKEN_GAS_LIMIT));
  const messageCost = maxSubmissionCostMessage.add(gasLimitMessage.mul(gasPriceBid));
  const totalCost = tokenCost.add(messageCost);

  // Encode bridge payload: (address, uint256, uint256, uint256, uint256)
  // Must be exactly 160 bytes (BRIDGE_PAYLOAD_LENGTH in the contract)
  const bridgePayload = encodeAbiParameters(
    parseAbiParameters('address, uint256, uint256, uint256, uint256'),
    [
      ARBITRUM_BRIDGE_MEDIATOR,
      BigInt(gasPriceBid.toString()),
      BigInt(maxSubmissionCostToken.toString()),
      BigInt(gasLimitMessage.toString()),
      BigInt(maxSubmissionCostMessage.toString()),
    ],
  );

  return {
    bridgePayload,
    value: BigInt(totalCost.toString()),
  };
};
