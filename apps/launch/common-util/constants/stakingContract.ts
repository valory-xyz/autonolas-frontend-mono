import { ethers } from 'ethers';
import { Address } from 'viem';
import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon } from 'viem/chains';

export const CONTRACT_TEMPLATES = [
  {
    title: 'Staking Token',
    // TODO: find better description?
    description:
      'This template contract is for staking a service by its owner when the service has an ERC20 token as the deposit',
  },
];

export const CONTRACT_COMMON_VALUES = {
  // Minimum service staking deposit value required for staking
  minStakingDeposit: ethers.parseUnits('10', 18),
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
  // Optional agent Ids requirement
  agentIds: [14],
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
  | typeof celo.id;

type Addresses = {
  [key in ChainId]: Address;
};

// TODO: update addresses when real contracts are deployed
export const IMPLEMENTATION_ADDRESSES: Addresses = {
  [mainnet.id]: '0x94c579253B3780f9fdEA6e7995EDe38142ef85A7',
  [optimism.id]: '' as Address,
  [gnosis.id]: '0x2E90D1049642b3f52d3B7Aa078A7563e58aA4913',
  [polygon.id]: '0x25b54b4f7fE78248079061Cc9bAA092611705a14',
  [base.id]: '' as Address,
  [arbitrum.id]: '' as Address,
  [celo.id]: '' as Address,
};

// TODO: update addresses when real contracts are deployed
export const ACTIVITY_CHECKER_ADDRESSES: Addresses = {
  [mainnet.id]: '0xD87dbF3074A1008394b092c0103E1d03cc73F7E1',
  [optimism.id]: '' as Address,
  [gnosis.id]: '0x0D33999A975323329bFF5351F61453E36F1d34a2',
  [polygon.id]: '0xE81261ed4f723c7389c066aC2D55dCD2e9f8BA59',
  [base.id]: '' as Address,
  [arbitrum.id]: '' as Address,
  [celo.id]: '' as Address,
};

export const SERVICE_REGISTRY_ADDRESSES: Addresses = {
  [mainnet.id]: '0x48b6af7B12C71f09e2fC8aF4855De4Ff54e775cA',
  [optimism.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [gnosis.id]: '0x9338b5153AE39BB89f50468E608eD9d764B755fD',
  [polygon.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [base.id]: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  [arbitrum.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [celo.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
};

export const SERVICE_REGISTRY_TOKEN_UTILITY_ADDRESSES: Addresses = {
  [mainnet.id]: '0x3Fb926116D454b95c669B6Bf2E7c3bad8d19affA',
  [optimism.id]: '0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac',
  [gnosis.id]: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  [polygon.id]: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  [base.id]: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
  [arbitrum.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [celo.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
};

export const STAKING_TOKEN_ADDRESSES: Addresses = {
  [mainnet.id]: '0x0001A500A6B18995B03f44bb040A5fFc28E45CB0',
  [optimism.id]: '0xFC2E6e6BCbd49ccf3A5f029c79984372DcBFE527',
  [gnosis.id]: '0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f',
  [polygon.id]: '0xFEF5d947472e72Efbb2E388c730B7428406F2F95',
  [base.id]: '0x54330d28ca3357F294334BDC454a032e7f353416',
  [arbitrum.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [celo.id]: '' as Address,
};

export const isSupportedChainId = (chainId: number): chainId is ChainId => {
  return chainId in IMPLEMENTATION_ADDRESSES;
};

type BlockNumber = {
  [key in ChainId]: number;
};

export const blockNumbers: BlockNumber = {
  [mainnet.id]: 20009952,
  [optimism.id]: 0,
  [gnosis.id]: 34225443,
  [polygon.id]: 57751430,
  [base.id]: 0,
  [arbitrum.id]: 0,
  [celo.id]: 0,
};
