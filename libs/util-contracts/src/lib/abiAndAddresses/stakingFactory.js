import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon, mode } from 'viem/chains';

export const STAKING_FACTORY = {
  contractName: 'StakingFactory',
  addresses: {
    [mainnet.id]: '0xEBdde456EA288b49f7D5975E7659bA1Ccf607efc',
    [optimism.id]: '0xa45E64d13A30a51b91ae0eb182e88a40e9b18eD8',
    [gnosis.id]: '0xb0228CA253A88Bc8eb4ca70BCAC8f87b381f4700',
    [polygon.id]: '0x46C0D07F55d4F9B5Eed2Fc9680B5953e5fd7b461',
    [base.id]: '0x1cEe30D08943EB58EFF84DD1AB44a6ee6FEff63a',
    [arbitrum.id]: '0xEB5638eefE289691EcE01943f768EDBF96258a80',
    [celo.id]: '0x1c2cD884127b080F940b7546c1e9aaf525b1FA55',
    [mode.id]: '0x75D529FAe220bC8db714F0202193726b46881B76',
  },
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_verifier',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
      ],
      name: 'ContractOnly',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'expected',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'provided',
          type: 'uint256',
        },
      ],
      name: 'IncorrectDataLength',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'instance',
          type: 'address',
        },
      ],
      name: 'InitializationFailed',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
      ],
      name: 'OwnerOnly',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
      ],
      name: 'ProxyCreationFailed',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ReentrancyGuard',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
      ],
      name: 'UnverifiedImplementation',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'instance',
          type: 'address',
        },
      ],
      name: 'UnverifiedProxy',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ZeroAddress',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'instance',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
      ],
      name: 'InstanceCreated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'instance',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'isEnabled',
          type: 'bool',
        },
      ],
      name: 'InstanceStatusChanged',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
      ],
      name: 'OwnerUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'verifier',
          type: 'address',
        },
      ],
      name: 'VerifierUpdated',
      type: 'event',
    },
    {
      inputs: [],
      name: 'SELECTOR_DATA_LENGTH',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'changeOwner',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newVerifier',
          type: 'address',
        },
      ],
      name: 'changeVerifier',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
        {
          internalType: 'bytes',
          name: 'initPayload',
          type: 'bytes',
        },
      ],
      name: 'createStakingInstance',
      outputs: [
        {
          internalType: 'address payable',
          name: 'instance',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
      ],
      name: 'getProxyAddress',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'localNonce',
          type: 'uint256',
        },
      ],
      name: 'getProxyAddressWithNonce',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'mapInstanceParams',
      outputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'deployer',
          type: 'address',
        },
        {
          internalType: 'bool',
          name: 'isEnabled',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'nonce',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'instance',
          type: 'address',
        },
        {
          internalType: 'bool',
          name: 'isEnabled',
          type: 'bool',
        },
      ],
      name: 'setInstanceStatus',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'verifier',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'instance',
          type: 'address',
        },
      ],
      name: 'verifyInstance',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'instance',
          type: 'address',
        },
      ],
      name: 'verifyInstanceAndGetEmissionsAmount',
      outputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
};
