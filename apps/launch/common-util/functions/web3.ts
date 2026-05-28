import { simulateContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Abi, Address, decodeEventLog, getAddress } from 'viem';
import { mainnet } from 'viem/chains';

import { STAKING_FACTORY, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { estimateGasWithBuffer } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';
import { getChainId } from 'common-util/functions/frontend-library';

type CreateContractParams = {
  implementation: Address;
  initPayload: string;
  account: Address;
};

/** Creates a new staking instance and returns its address from the InstanceCreated event. */
export const createStakingContract = async ({
  implementation,
  initPayload,
  account,
}: CreateContractParams): Promise<{ instance: Address }> => {
  const chainId = getChainId();
  if (chainId === undefined) throw new Error('Cannot determine chain ID');
  const address = (STAKING_FACTORY.addresses as Record<number, Address>)[chainId];
  const expected = getAddress(address);

  const callParams = {
    address,
    abi: STAKING_FACTORY.abi as Abi,
    functionName: 'createStakingInstance' as const,
    args: [implementation, initPayload],
    account,
    chainId,
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);

  const hash = await writeContract(wagmiConfig, { ...request, gas, chainId });
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId });

  for (const log of receipt.logs) {
    if (getAddress(log.address) !== expected) continue;
    try {
      const decoded = decodeEventLog({
        abi: STAKING_FACTORY.abi as Abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'InstanceCreated') {
        const args = decoded.args as unknown as { instance: Address };
        return { instance: args.instance };
      }
    } catch (err) {
      console.warn('Unexpected StakingFactory log not decodable by ABI:', err);
    }
  }

  throw new Error('InstanceCreated event not found in transaction receipt');
};

type AddNomineeParams = {
  address: Address;
  nomineeChainId: number;
  account: Address;
};

/** Adds an EVM nominee to the VoteWeighting contract on mainnet. */
export const addNominee = async ({ address, nomineeChainId, account }: AddNomineeParams) => {
  // Widen mainnet.id from literal `1` to `number` so wagmi's simulate/write/wait
  // overloads accept it against the workspace's non-const chains tuple.
  const txChainId: number = mainnet.id;
  const voteWeightingAddress = (VOTE_WEIGHTING.addresses as Record<number, Address>)[txChainId];

  const callParams = {
    address: voteWeightingAddress,
    abi: VOTE_WEIGHTING.abi as Abi,
    functionName: 'addNomineeEVM' as const,
    args: [address, nomineeChainId],
    account,
    chainId: txChainId,
  };
  const { request } = await simulateContract(wagmiConfig, callParams);
  const gas = await estimateGasWithBuffer(wagmiConfig, callParams);

  const hash = await writeContract(wagmiConfig, { ...request, gas, chainId: txChainId });
  return waitForTransactionReceipt(wagmiConfig, { hash, chainId: txChainId });
};
