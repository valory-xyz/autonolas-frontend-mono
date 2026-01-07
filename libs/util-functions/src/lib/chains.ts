/**
 * Checks if the chain ID is an L1-only network (only Ethereum mainnet or Goerli, excluding L2s)
 * @param chainId - The chain ID to check
 * @returns True if the chain ID is an L1-only network
 */
export const isL1Network = (chainId: number | string | undefined): boolean => {
  if (!chainId) return false;
  const chainIdNum = typeof chainId === 'string' ? Number(chainId) : chainId;
  return chainIdNum === 1 || chainIdNum === 5;
};
