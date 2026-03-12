import { Contract } from 'ethers';

// TODO: better handle setting 2M for base/gnosis, 500k for ethereum
const ESTIMATED_GAS_LIMIT = 2_000_000;

/**
 * function to estimate gas limit
 */
export const getEstimatedGasLimit = async (
  fn: Contract['methods'],
  account: string | undefined,
  value?: string | number,
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
