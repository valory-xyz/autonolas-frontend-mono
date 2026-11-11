import { mainnet } from 'viem/chains';

// Widened to `number`: the literal `1` fails wagmi's chain-tuple constraint in simulate/write/wait.
export const MAINNET_CHAIN_ID: number = mainnet.id;
