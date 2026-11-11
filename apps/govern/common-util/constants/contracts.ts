import type { Address } from 'viem';
import { mainnet } from 'viem/chains';

import { DISPENSER, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

/** The mainnet Dispenser the claim flow reads and claims through. */
export const DISPENSER_ADDRESS = DISPENSER.addresses[mainnet.id];

/** The mainnet VoteWeighting the claim flow checkpoints and reads weights from. */
export const VOTE_WEIGHTING_ADDRESS = (VOTE_WEIGHTING.addresses as Record<number, Address>)[
  mainnet.id
];
