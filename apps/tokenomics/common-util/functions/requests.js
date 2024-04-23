const ESTIMATED_GAS_LIMIT = 500_000;

/**
 * function to estimate gas limit
 */
export const getEstimatedGasLimit = async (fn, account) => {
  try {
    const estimatedGas = await fn.estimateGas({ from: account });
    return Math.floor(estimatedGas);
  } catch (error) {
    window.console.warn(
      `Error occurred on estimating gas, defaulting to ${ESTIMATED_GAS_LIMIT}`,
    );
    return ESTIMATED_GAS_LIMIT;
  }
};
