import type { Address } from 'viem';
import { mainnet } from 'viem/chains';

import { DISPENSER, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

/**
 * If the user didn't allocate 100% of their votes but only allocated them partially,
 * the remaining votes will go to the Retainer (rollover pool) and will remain unminted
 */
export const RETAINER_ADDRESS = '0x000000000000000000000000000000000000dEaD';

/** Mainnet addresses, as `libs/util-contracts` maps them (the D23 address switch edits those). */
export const DISPENSER_ADDRESS = DISPENSER.addresses[mainnet.id];
export const VOTE_WEIGHTING_ADDRESS = (VOTE_WEIGHTING.addresses as Record<number, Address>)[
  mainnet.id
];
