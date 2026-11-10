import { mainnet } from 'viem/chains';

/**
 * Ethereum mainnet's id, widened to `number`: the literal `1` does not satisfy the chain-tuple
 * constraint of wagmi 2.19+'s simulate/write/wait overloads.
 */
export const MAINNET_CHAIN_ID: number = mainnet.id;
