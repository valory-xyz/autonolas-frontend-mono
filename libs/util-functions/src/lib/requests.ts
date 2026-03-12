import { Contract } from 'ethers';

const ESTIMATED_GAS_LIMIT = 500_000;

/**
 * function to estimate gas limit
 */
export const getEstimatedGasLimit = async (
  fn: Contract['methods'],
  account: `0x${string}` | string | undefined,
  value?: string,
) => {
  if (!account) {
    throw new Error('Invalid account passed to estimate gas limit');
  }

  try {
    const estimatedGas = await fn.estimateGas({ from: account, value });
    return Math.ceil(Number(estimatedGas) * 1.2);
  } catch (error) {
    window.console.warn(`Error occurred on estimating gas, defaulting to ${ESTIMATED_GAS_LIMIT}`);
  }

  return ESTIMATED_GAS_LIMIT;
};
