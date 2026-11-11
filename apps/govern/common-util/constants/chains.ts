import { mainnet } from 'viem/chains';

// Widened to `number` for wagmi's simulate/write/wait overloads, as in marketplace's `params.ts`.
export const MAINNET_CHAIN_ID: number = mainnet.id;
