import { Address } from 'viem';
import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon, mode } from 'viem/chains';

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
  | typeof mode.id;

type Addresses = {
  [key in ChainId]: Address;
};

export const IMPLEMENTATION_ADDRESSES: Addresses = {
  [mainnet.id]: '0x0Dc23eEf3bC64CF3cbd8f9329B57AE4C4f28d5d2',
  [optimism.id]: '0x63C2c53c09dE534Dd3bc0b7771bf976070936bAC',
  [gnosis.id]: '0xEa00be6690a871827fAfD705440D20dd75e67AB1',
  [polygon.id]: '0x4aba1Cf7a39a51D75cBa789f5f21cf4882162519',
  [base.id]: '0xEB5638eefE289691EcE01943f768EDBF96258a80',
  [arbitrum.id]: '0x04b0007b2aFb398015B76e5f22993a1fddF83644',
  [celo.id]: '0xe1E1B286EbE95b39F785d8069f2248ae9C41b7a9',
  [mode.id]: '0xE49CB081e8d96920C38aA7AB90cb0294ab4Bc8EA',
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
};

export const STAKING_TOKEN_ADDRESSES: Addresses = {
  [mainnet.id]: '0x0001A500A6B18995B03f44bb040A5fFc28E45CB0',
  [optimism.id]: '0xFC2E6e6BCbd49ccf3A5f029c79984372DcBFE527',
  [gnosis.id]: '0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f',
  [polygon.id]: '0xFEF5d947472e72Efbb2E388c730B7428406F2F95',
  [base.id]: '0x54330d28ca3357F294334BDC454a032e7f353416',
  [arbitrum.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [celo.id]: '0xaCFfAe8e57Ec6E394Eb1b41939A8CF7892DbDc51',
  [mode.id]: '0xcfD1D50ce23C46D3Cf6407487B2F8934e96DC8f9',
};

export const isSupportedChainId = (chainId: number): chainId is ChainId => {
  return chainId in IMPLEMENTATION_ADDRESSES;
};

type BlockNumbers = {
  [key in ChainId]: number;
};

export const blockNumbers: BlockNumbers = {
  [mainnet.id]: 20342524,
  [optimism.id]: 122903952,
  [gnosis.id]: 35047282,
  [polygon.id]: 59560456,
  [base.id]: 17310019,
  [arbitrum.id]: 233883523,
  [celo.id]: 26748574,
  [mode.id]: 14444647,
};
