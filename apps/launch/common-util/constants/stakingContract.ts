import { Address } from 'viem';
import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon, mode } from 'viem/chains';

import { robinhood } from 'libs/util-constants/src';

export const CONTRACT_TEMPLATES = [
  {
    title: 'Staking Token',
    description:
      'This template contract is for staking a service by its owner when the service has an ERC20 token as the deposit',
  },
];

export const CONTRACT_DEFAULT_VALUES = {
  // Minimum service staking deposit value required for staking
  minStakingDeposit: 10,
  // Min number of staking periods before the service can be unstaked
  minNumStakingPeriods: 3,
  // Max number of accumulated inactivity periods after which the service is evicted
  maxNumInactivityPeriods: 2,
  // Time frame during which the staking contract assesses the activity of the service
  livenessPeriod: 86400, // 1 day
  // Time for emissions
  timeForEmissions: 2592000, // 30 days
  // Number of agent instances in the service
  numAgentInstances: 1,
  // Optional service multisig threshold requirement
  threshold: 0,
  // Optional service configuration hash requirement
  configHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  // Approved multisig proxy hash
  proxyHash: '0xb89c1b3bdf2cf8827818646bce9a8f6e372885f8c55e5c07acbd307cb133b000',
};

export type ChainId =
  | typeof mainnet.id
  | typeof optimism.id
  | typeof gnosis.id
  | typeof polygon.id
  | typeof base.id
  | typeof arbitrum.id
  | typeof celo.id
  | typeof mode.id
  | typeof robinhood.id;

type Addresses = {
  [key in ChainId]: Address;
};

/**
 * The StakingToken 0.4.0 implementation new staking contracts are created from, per chain
 * (autonolas-registries `scripts/deployment` globals, `stakingTokenAddress`). Existing contracts
 * keep the implementation they were created from.
 */
export const STAKING_TOKEN_ADDRESSES: Addresses = {
  [mainnet.id]: '0x3A8867A5A31c5E26e6b8c740c1E1Aa920802d4BA',
  [optimism.id]: '0x28C1edC7CEd549F7f80B732fDC19f0370160707d',
  [gnosis.id]: '0x5777C44C8926085C2d7cF33735F57f2f05A90a1a',
  [polygon.id]: '0x980b47e2B78403fBeDd59fbd6C7f8bF93d2E6B10',
  [base.id]: '0x67C48a1cdCBCC311CA6484560F8c5066F3655b6e',
  [arbitrum.id]: '0x887A511e3DfE4dDa77c0b1783c01d9920351A83D',
  [celo.id]: '0xf78b3C22A204Da5d9a0B080C5D3d695AF4918886',
  [mode.id]: '0x5add592ce0a1B5DceCebB5Dcac086Cd9F9e3eA5C',
  [robinhood.id]: '0x5add592ce0a1B5DceCebB5Dcac086Cd9F9e3eA5C',
};

export const SERVICE_REGISTRY_ADDRESSES: Addresses = {
  [mainnet.id]: '0x48b6af7B12C71f09e2fC8aF4855De4Ff54e775cA',
  [optimism.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [gnosis.id]: '0x9338b5153AE39BB89f50468E608eD9d764B755fD',
  [polygon.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [base.id]: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  [arbitrum.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [celo.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [mode.id]: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  [robinhood.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
};

export const SERVICE_REGISTRY_TOKEN_UTILITY_ADDRESSES: Addresses = {
  [mainnet.id]: '0x3Fb926116D454b95c669B6Bf2E7c3bad8d19affA',
  [optimism.id]: '0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac',
  [gnosis.id]: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  [polygon.id]: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  [base.id]: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
  [arbitrum.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [celo.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [mode.id]: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
  [robinhood.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
};

export const OLAS_ADDRESSES: Addresses = {
  [mainnet.id]: '0x0001A500A6B18995B03f44bb040A5fFc28E45CB0',
  [optimism.id]: '0xFC2E6e6BCbd49ccf3A5f029c79984372DcBFE527',
  [gnosis.id]: '0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f',
  [polygon.id]: '0xFEF5d947472e72Efbb2E388c730B7428406F2F95',
  [base.id]: '0x54330d28ca3357F294334BDC454a032e7f353416',
  [arbitrum.id]: '0x064f8b858c2a603e1b106a2039f5446d32dc81c1',
  // Note: there are two OLAS addresses on celo, this one
  // should be used for staking contracts
  [celo.id]: '0xD80533CA29fF6F033a0b55732Ed792af9Fbb381E',
  [mode.id]: '0xcfD1D50ce23C46D3Cf6407487B2F8934e96DC8f9',
  [robinhood.id]: '0x092963938deBD8013a2e545b3549f8A5ec0D2286',
};

export const isSupportedChainId = (chainId: number): chainId is ChainId => {
  return chainId in STAKING_TOKEN_ADDRESSES;
};

type BlockNumbers = {
  [key in ChainId]: number;
};

export const blockNumbers: BlockNumbers = {
  [mainnet.id]: 24634866,
  [optimism.id]: 122903952,
  [gnosis.id]: 35047282,
  [polygon.id]: 59560456,
  [base.id]: 17310019,
  [arbitrum.id]: 233883523,
  [celo.id]: 61345380,
  [mode.id]: 14444647,
  // StakingFactory creation tx (deployer 0xeb2a…14e, nonce 16) — found by scanning blocks on the
  // 4663 RPC since it is non-archive and Blockscout is Cloudflare-gated; the factory's first log
  // is at 60148213 and its next deployer tx (nonce 17) at 58662633, both later.
  [robinhood.id]: 58661778,
};
