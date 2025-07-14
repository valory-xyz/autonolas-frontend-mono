import { readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Address } from 'viem';
import { base } from 'wagmi/chains';

import { OLAS_ABI, OLAS_ADDRESS_BASE } from 'common-util/AbiAndAddresses';
import { getContributorsContract } from 'common-util/Contracts';
import { wagmiConfig } from 'common-util/Login/config';
import { getEstimatedGasLimit } from 'common-util/functions/requests';

// Value in wei that should be sent with CreateAndStake transaction
// 1 wei for the service registration activation,
// and 1 wei for agent instance bond, which is always equal to 1 for now
const CREATE_AND_STAKE_VALUE = 2;

/**
 * Check if user has enough OLAS balance
 */
export const checkHasEnoughOlas = async ({
  account,
  amountInWei,
}: {
  account: Address;
  amountInWei: bigint;
}) => {
  const result = await readContract(wagmiConfig, {
    address: OLAS_ADDRESS_BASE,
    abi: OLAS_ABI,
    chainId: base.id,
    functionName: 'balanceOf',
    args: [account],
  });

  return result ? BigInt(result) >= BigInt(amountInWei) : false;
};

/**
 * Check if the OLAS token allowance is sufficient for transfer to the Contributors
 */
const hasSufficientOlasAllowanceForAddress = async ({
  account,
  addressToApprove,
  amountToApprove,
}: {
  account: Address;
  addressToApprove: Address;
  amountToApprove: bigint;
}) => {
  try {
    const allowance = await readContract(wagmiConfig, {
      address: OLAS_ADDRESS_BASE,
      abi: OLAS_ABI,
      chainId: base.id,
      functionName: 'allowance',
      args: [account, addressToApprove],
    });
    return allowance >= amountToApprove;
  } catch (error) {
    console.error('Error checking allowance:', error);
    return null;
  }
};

/**
 * Approve Olas transfer to the provided address
 */
// @ts-ignore TODO: fix code paths issues
const approveOlasForAddress = async ({
  addressToApprove,
  amountToApprove,
}: {
  addressToApprove: Address;
  amountToApprove: bigint;
}) => {
  try {
    const hash = await writeContract(wagmiConfig, {
      address: OLAS_ADDRESS_BASE,
      abi: OLAS_ABI,
      chainId: base.id as number,
      functionName: 'approve',
      args: [addressToApprove, amountToApprove],
    });
    // Wait for the transaction receipt
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      chainId: base.id,
      hash,
    });
    return receipt;
  } catch (error) {
    console.error('Error approving tokens:', error);
  }
};

/**
 * Check and approve token transfer if not yet approved
 */
export const checkAndApproveOlasForAddress = async ({
  account,
  addressToApprove,
  amountToApprove,
}: {
  account: Address;
  addressToApprove: Address;
  amountToApprove: bigint;
}) => {
  const hasTokenBalance = await hasSufficientOlasAllowanceForAddress({
    account,
    addressToApprove,
    amountToApprove,
  });

  if (!hasTokenBalance) {
    const response = await approveOlasForAddress({
      addressToApprove,
      amountToApprove,
    });
    return response;
  }

  return null;
};

/**
 * Create, deploy and stake a service
 */
export const createAndStake = async ({
  account,
  socialId,
  stakingInstance,
}: {
  account: Address;
  socialId: string;
  stakingInstance: Address;
}) => {
  try {
    const contract = getContributorsContract();
    const createAndStakeFn = contract.methods.createAndStake(socialId, stakingInstance);
    const estimatedGas = await getEstimatedGasLimit(
      createAndStakeFn,
      account,
      CREATE_AND_STAKE_VALUE,
    );
    const result = await createAndStakeFn.send({
      from: account,
      gas: estimatedGas,
      value: CREATE_AND_STAKE_VALUE,
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      chainId: base.id,
      hash: result.transactionHash,
    });
    return receipt;
  } catch (error) {
    console.error('Error creating and staking:', error);
    throw error;
  }
};
