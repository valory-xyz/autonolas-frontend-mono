import { Address } from 'viem';
import { LOCAL_FORK_ID, LOCAL_FORK_ID_GNOSIS, LOCAL_FORK_ID_POLYGON } from '../../util/constants';

type Addresses = {
  serviceManagerToken: Address;
  serviceRegistryL2: Address;
  serviceRegistryTokenUtility: Address;
  operatorWhitelist: Address;
};

type L1Addresses = {
  agentRegistry: Address;
  componentRegistry: Address;
  registriesManager: Address;
  serviceManagerToken: Address;
  serviceRegistry: Address;
  serviceRegistryTokenUtility: Address;
  operatorWhitelist: Address;
};

const MAINNET_ADDRESSES: L1Addresses = {
  agentRegistry: '0x2F1f7D38e4772884b88f3eCd8B6b9faCdC319112',
  componentRegistry: '0x15bd56669F57192a97dF41A2aa8f4403e9491776',
  registriesManager: '0x9eC9156dEF5C613B2a7D4c46C383F9B58DfcD6fE',
  serviceManagerToken: '0x2EA682121f815FBcF86EA3F3CaFdd5d67F2dB143',
  serviceRegistry: '0x48b6af7B12C71f09e2fC8aF4855De4Ff54e775cA',
  serviceRegistryTokenUtility: '0x3Fb926116D454b95c669B6Bf2E7c3bad8d19affA',
  operatorWhitelist: '0x42042799B0DE38AdD2a70dc996f69f98E1a85260',
};

const GNOSIS_ADDRESSES: Addresses = {
  serviceManagerToken: '0x04b0007b2aFb398015B76e5f22993a1fddF83644',
  serviceRegistryL2: '0x9338b5153AE39BB89f50468E608eD9d764B755fD',
  serviceRegistryTokenUtility: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  operatorWhitelist: '0x526E064cB694E8f5B7DB299158e17F33055B3943',
};

const POLYGON_ADDRESSES: Addresses = {
  serviceManagerToken: '0x04b0007b2aFb398015B76e5f22993a1fddF83644',
  serviceRegistryL2: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  serviceRegistryTokenUtility: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  operatorWhitelist: '0x526E064cB694E8f5B7DB299158e17F33055B3943',
};

/**
 * Addresses for testing for networks
 * - sepolia
 * - arbitrum
 * - optimistic
 * - celo
 */
const COMMON_TEST_ADDRESSES: Addresses = {
  serviceManagerToken: '0x5BA58970c2Ae16Cf6218783018100aF2dCcFc915',
  serviceRegistryL2: '0x31D3202d8744B16A120117A053459DDFAE93c855',
  serviceRegistryTokenUtility: '0xeB49bE5DF00F74bd240DE4535DDe6Bc89CEfb994',
  operatorWhitelist: '0x29086141ecdc310058fc23273F8ef7881d20C2f7',
};

// TODO: add testcases for all networks
// get addresses from scripts/deployment folder in autonolas-registries repo
export const ADDRESSES = {
  1: MAINNET_ADDRESSES,
  // goerli
  5: {
    agentRegistry: '0xEB5638eefE289691EcE01943f768EDBF96258a80',
    componentRegistry: '0x7Fd1F4b764fA41d19fe3f63C85d12bf64d2bbf68',
    registriesManager: '0x10c5525F77F13b28f42c5626240c001c2D57CAd4',
    serviceManagerToken: '0x1d333b46dB6e8FFd271b6C2D2B254868BD9A2dbd',
    serviceRegistry: '0x1cEe30D08943EB58EFF84DD1AB44a6ee6FEff63a',
    serviceRegistryTokenUtility: '0x6d9b08701Af43D68D991c074A27E4d90Af7f2276',
    operatorWhitelist: '0x0338893fB1A1D9Df03F72CC53D8f786487d3D03E',
  },
  // optimistic
  10: {
    serviceManagerToken: '0xFbBEc0C8b13B38a9aC0499694A69a10204c5E2aB',
    serviceRegistryL2: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
    serviceRegistryTokenUtility: '0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac',
    operatorWhitelist: '0x63e66d7ad413C01A7b49C7FF4e3Bb765C4E4bd1b',
  },
  // gnosis
  100: GNOSIS_ADDRESSES,
  // polygon
  137: POLYGON_ADDRESSES,
  // base
  8453: {
    serviceManagerToken: '0x63e66d7ad413C01A7b49C7FF4e3Bb765C4E4bd1b',
    serviceRegistryL2: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
    serviceRegistryTokenUtility: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
    operatorWhitelist: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  },
  // chiado
  10200: {
    serviceManagerToken: '0xc965a32185590Eb5a5fffDba29E96126b7650eDe',
    serviceRegistryL2: '0x31D3202d8744B16A120117A053459DDFAE93c855',
    serviceRegistryTokenUtility: '0xc2c7E40674f1C7Bb99eFe5680Efd79842502bED4',
    operatorWhitelist: '0x6f7661F52fE1919996d0A4F68D09B344093a349d',
  },
  // arbitrum
  42161: {
    serviceManagerToken: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
    serviceRegistryL2: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
    serviceRegistryTokenUtility: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
    operatorWhitelist: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  },
  // celo
  42220: {
    serviceManagerToken: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
    serviceRegistryL2: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
    serviceRegistryTokenUtility: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
    operatorWhitelist: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  },
  // polygon mumbai - testnet for polygon
  80001: {
    serviceManagerToken: '0xE16adc7777B7C2a0d35033bd3504C028AB28EE8b',
    serviceRegistryL2: '0xf805DfF246CC208CD2F08ffaD242b7C32bc93623',
    serviceRegistryTokenUtility: '0x131b5551c81e9B3E89E9ACE30A5B3D45144E3e42',
    operatorWhitelist: '0x118173028162C1b7c6Bf8488bd5dA2abd7c30F9D',
  },
  // base sepolia - testnet for base
  84532: COMMON_TEST_ADDRESSES,
  // arbitrum sepolia - testnet for arbitrum
  421614: COMMON_TEST_ADDRESSES,
  // optimistic sepolia - testnet for optimistic
  11155420: COMMON_TEST_ADDRESSES,
  // celo alfajores - testnet for celo
  44787: COMMON_TEST_ADDRESSES,
  [LOCAL_FORK_ID]: MAINNET_ADDRESSES,
  [LOCAL_FORK_ID_GNOSIS]: GNOSIS_ADDRESSES,
  [LOCAL_FORK_ID_POLYGON]: POLYGON_ADDRESSES,
} as const;

export type ChainIds = keyof typeof ADDRESSES;

type MultisigAddress = {
  [chainId in ChainIds]: Address[];
};
// TODO: add testcases for all networks
/**
 * check addresses here - GnosisSafeMultisig
 * Addresses: https://github.com/valory-xyz/autonolas-registries/blob/main/docs/configuration.json
 */
export const multisigAddresses: MultisigAddress = {
  1: ['0x46C0D07F55d4F9B5Eed2Fc9680B5953e5fd7b461'],
  5: ['0x65dD51b02049ad1B6FF7fa9Ea3322E1D2CAb1176'],
  10: ['0xE43d4F4103b623B61E095E8bEA34e1bc8979e168'],
  100: ['0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE'],
  137: ['0x3d77596beb0f130a4415df3D2D8232B3d3D31e44'],
  8453: ['0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac'],
  10200: ['0xeB49bE5DF00F74bd240DE4535DDe6Bc89CEfb994'],
  80001: ['0x9dEc6B62c197268242A768dc3b153AE7a2701396'],
  84532: ['0x19936159B528C66750992C3cBcEd2e71cF4E4824'],
  42161: ['0x63e66d7ad413C01A7b49C7FF4e3Bb765C4E4bd1b'],
  42220: ['0x63e66d7ad413C01A7b49C7FF4e3Bb765C4E4bd1b'],
  421614: ['0x19936159B528C66750992C3cBcEd2e71cF4E4824'],
  11155420: ['0x19936159B528C66750992C3cBcEd2e71cF4E4824'],
  44787: ['0x19936159B528C66750992C3cBcEd2e71cF4E4824'],
  [LOCAL_FORK_ID]: ['0x46C0D07F55d4F9B5Eed2Fc9680B5953e5fd7b461'],
  [LOCAL_FORK_ID_GNOSIS]: ['0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE'],
  [LOCAL_FORK_ID_POLYGON]: ['0x3d77596beb0f130a4415df3D2D8232B3d3D31e44'],
};

/**
 * check addresses here - GnosisSafeSameAddressMultisig
 * Addresses: https://github.com/valory-xyz/autonolas-registries/blob/main/docs/configuration.json
 */
export const multisigSameAddresses: MultisigAddress = {
  1: ['0xfa517d01DaA100cB1932FA4345F68874f7E7eF46'],
  5: ['0x06467Cb835da623384a22aa902647784C1c9f5Ae'],
  10: ['0xb09CcF0Dbf0C178806Aaee28956c74bd66d21f73'],
  100: ['0x6e7f594f680f7aBad18b7a63de50F0FeE47dfD06'],
  137: ['0xd8BCC126ff31d2582018715d5291A508530587b0'],
  10200: ['0xE16adc7777B7C2a0d35033bd3504C028AB28EE8b'],
  8453: ['0xFbBEc0C8b13B38a9aC0499694A69a10204c5E2aB'],
  80001: ['0xd6AA4Ec948d84f6Db8EEf25104CeE0Ecd280C74e'],
  84532: ['0x10100e74b7F706222F8A7C0be9FC7Ae1717Ad8B2'],
  42161: ['0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac'],
  42220: ['0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac'],
  421614: ['0x10100e74b7F706222F8A7C0be9FC7Ae1717Ad8B2'],
  11155420: ['0x10100e74b7F706222F8A7C0be9FC7Ae1717Ad8B2'],
  44787: ['0x10100e74b7F706222F8A7C0be9FC7Ae1717Ad8B2'],
  [LOCAL_FORK_ID]: ['0xfa517d01DaA100cB1932FA4345F68874f7E7eF46'],
  [LOCAL_FORK_ID_GNOSIS]: ['0x6e7f594f680f7aBad18b7a63de50F0FeE47dfD06'],
  [LOCAL_FORK_ID_POLYGON]: ['0xd8BCC126ff31d2582018715d5291A508530587b0'],
};

/**
 * check addresses here - MultiSendCallOnly
 * https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/multi_send_call_only.json
 */
export const safeMultiSend: MultisigAddress = {
  1: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  5: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  10: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  100: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  137: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  8453: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  10200: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  80001: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  84532: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  42161: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  42220: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  421614: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  11155420: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  44787: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  [LOCAL_FORK_ID]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  [LOCAL_FORK_ID_GNOSIS]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  [LOCAL_FORK_ID_POLYGON]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
};

/**
 * check addresses here
 * https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/compatibility_fallback_handler.json
 */
export const FALLBACK_HANDLER: {
  [chainId in ChainIds]: Address;
} = {
  1: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  5: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  10: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  100: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  137: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  8453: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  10200: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  80001: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  84532: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  42161: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  42220: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  421614: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  11155420: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  44787: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  [LOCAL_FORK_ID]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  [LOCAL_FORK_ID_GNOSIS]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  [LOCAL_FORK_ID_POLYGON]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
};

/**
 * SVM addresses
 */

export const SOLANA_ADDRESSES = {
  serviceRegistry: 'AU428Z7KbjRMjhmqWmQwUta2AvydbpfEZNBh8dStHTDi',
  storageAccount: 'AjHVkc5XV7wiH3KyqznfCGvMofmBQL8agF6HxCjn6H1R',
  pda: 'Gtb5et18X9b63Yex1wpPtKezeXznqDiqJ3zXh1WAqRxK',
};

export const SOLANA_DEVNET_ADDRESSES = {
  serviceRegistry: 'AU428Z7KbjRMjhmqWmQwUta2AvydbpfEZNBh8dStHTDi',
  storageAccount: '2afUAb8aRfcUentfGone5L2J5DeKz9PsSj4zs1WZREUf',
  pda: 'Gtb5et18X9b63Yex1wpPtKezeXznqDiqJ3zXh1WAqRxK',
};
