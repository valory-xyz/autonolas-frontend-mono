import { Address } from 'viem';
import { arbitrum, base, celo, gnosis, mainnet, mode, optimism, polygon } from 'viem/chains';

type Addresses = {
  serviceRegistryL2: Address;
  serviceRegistryTokenUtility: Address;
  operatorWhitelist: Address;
  mechMarketplace?: Address;
};

type L1Addresses = {
  agentRegistry: Address;
  componentRegistry: Address;
  registriesManager: Address;
  serviceRegistry: Address;
  serviceRegistryTokenUtility: Address;
  operatorWhitelist: Address;
};

const MAINNET_ADDRESSES: L1Addresses = {
  agentRegistry: '0x2F1f7D38e4772884b88f3eCd8B6b9faCdC319112',
  componentRegistry: '0x15bd56669F57192a97dF41A2aa8f4403e9491776',
  registriesManager: '0x9eC9156dEF5C613B2a7D4c46C383F9B58DfcD6fE',
  serviceRegistry: '0x48b6af7B12C71f09e2fC8aF4855De4Ff54e775cA',
  serviceRegistryTokenUtility: '0x3Fb926116D454b95c669B6Bf2E7c3bad8d19affA',
  operatorWhitelist: '0x42042799B0DE38AdD2a70dc996f69f98E1a85260',
};

const GNOSIS_ADDRESSES: Addresses = {
  serviceRegistryL2: '0x9338b5153AE39BB89f50468E608eD9d764B755fD',
  serviceRegistryTokenUtility: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  operatorWhitelist: '0x526E064cB694E8f5B7DB299158e17F33055B3943',
  mechMarketplace: '0x735FAAb1c4Ec41128c367AFb5c3baC73509f70bB',
};

const POLYGON_ADDRESSES: Addresses = {
  serviceRegistryL2: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  serviceRegistryTokenUtility: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
  operatorWhitelist: '0x526E064cB694E8f5B7DB299158e17F33055B3943',
};

const MODE_ADDRESSES: Addresses = {
  serviceRegistryL2: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  serviceRegistryTokenUtility: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
  operatorWhitelist: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
};

// TODO: add testcases for all networks
// get addresses from scripts/deployment folder in autonolas-registries repo
export const ADDRESSES = {
  [mainnet.id]: MAINNET_ADDRESSES,
  [optimism.id]: {
    serviceRegistryL2: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
    serviceRegistryTokenUtility: '0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac',
    operatorWhitelist: '0x63e66d7ad413C01A7b49C7FF4e3Bb765C4E4bd1b',
  },
  [gnosis.id]: GNOSIS_ADDRESSES,
  [polygon.id]: POLYGON_ADDRESSES,
  [base.id]: {
    serviceRegistryL2: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
    serviceRegistryTokenUtility: '0x34C895f302D0b5cf52ec0Edd3945321EB0f83dd5',
    operatorWhitelist: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
    mechMarketplace: '0xf24eE42edA0fc9b33B7D41B06Ee8ccD2Ef7C5020',
  },
  [arbitrum.id]: {
    serviceRegistryL2: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
    serviceRegistryTokenUtility: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
    operatorWhitelist: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  },
  [celo.id]: {
    serviceRegistryL2: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
    serviceRegistryTokenUtility: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
    operatorWhitelist: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  },
  [mode.id]: MODE_ADDRESSES,
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
  [mainnet.id]: ['0x46C0D07F55d4F9B5Eed2Fc9680B5953e5fd7b461'],
  [optimism.id]: ['0x5953f21495BD9aF1D78e87bb42AcCAA55C1e896C'],
  [gnosis.id]: ['0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE'],
  [polygon.id]: ['0x3d77596beb0f130a4415df3D2D8232B3d3D31e44'],
  [base.id]: ['0x22bE6fDcd3e29851B29b512F714C328A00A96B83'],
  [arbitrum.id]: ['0x63e66d7ad413C01A7b49C7FF4e3Bb765C4E4bd1b'],
  [celo.id]: ['0x63e66d7ad413C01A7b49C7FF4e3Bb765C4E4bd1b'],
  [mode.id]: ['0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac'],
};

/**
 * check addresses here - GnosisSafeSameAddressMultisig
 * Addresses: https://github.com/valory-xyz/autonolas-registries/blob/main/docs/configuration.json
 */
export const multisigSameAddresses: MultisigAddress = {
  [mainnet.id]: ['0xfa517d01DaA100cB1932FA4345F68874f7E7eF46'],
  [optimism.id]: ['0xb09CcF0Dbf0C178806Aaee28956c74bd66d21f73'],
  [gnosis.id]: ['0x6e7f594f680f7aBad18b7a63de50F0FeE47dfD06'],
  [polygon.id]: ['0xd8BCC126ff31d2582018715d5291A508530587b0'],
  [base.id]: ['0xFbBEc0C8b13B38a9aC0499694A69a10204c5E2aB'],
  [arbitrum.id]: ['0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac'],
  [celo.id]: ['0xBb7e1D6Cb6F243D6bdE81CE92a9f2aFF7Fbe7eac'],
  [mode.id]: ['0xFbBEc0C8b13B38a9aC0499694A69a10204c5E2aB'],
};

/**
 * check addresses here - MultiSendCallOnly
 * https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/multi_send_call_only.json
 */
export const safeMultiSend: MultisigAddress = {
  [mainnet.id]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  [optimism.id]: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  [gnosis.id]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  [polygon.id]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  [base.id]: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  [arbitrum.id]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
  [celo.id]: ['0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B'],
  [mode.id]: ['0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'],
};

/**
 * check addresses here
 * https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/compatibility_fallback_handler.json
 */
export const FALLBACK_HANDLER: {
  [chainId in ChainIds]: Address;
} = {
  [mainnet.id]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  [optimism.id]: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  [gnosis.id]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  [polygon.id]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  [base.id]: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  [arbitrum.id]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  [celo.id]: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  [mode.id]: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
};

/**
 * SVM addresses
 */

export const SOLANA_ADDRESSES = {
  serviceRegistry: 'AU428Z7KbjRMjhmqWmQwUta2AvydbpfEZNBh8dStHTDi',
  storageAccount: 'AjHVkc5XV7wiH3KyqznfCGvMofmBQL8agF6HxCjn6H1R',
  pda: 'Gtb5et18X9b63Yex1wpPtKezeXznqDiqJ3zXh1WAqRxK',
};
