/**
 * The address, to which non-allocated votes are sent
 */
export const RETAINER_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// Blacklisted staking contracts that should not be displayed
export const BLACKLISTED_STAKING_ADDRESSES = [
  RETAINER_ADDRESS,
  // Jinn staking contract with invalid IPFS metadata (keccak256 hash instead of IPFS CID)
  '0x0dfafbf570e9e813507aae18aa08dfba0abc5139',
];
