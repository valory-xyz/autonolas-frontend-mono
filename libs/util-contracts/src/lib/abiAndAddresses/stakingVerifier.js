export const STAKING_VERIFIER = {
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_olas',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: '_rewardsPerSecondLimit',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_timeForEmissionsLimit',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_numServicesLimit',
          type: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
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
          internalType: 'uint256',
          name: 'numValues1',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'numValues2',
          type: 'uint256',
        },
      ],
      name: 'WrongArrayLength',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ZeroAddress',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ZeroValue',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address[]',
          name: 'implementations',
          type: 'address[]',
        },
        {
          indexed: false,
          internalType: 'bool[]',
          name: 'statuses',
          type: 'bool[]',
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'setCheck',
          type: 'bool',
        },
      ],
      name: 'ImplementationsWhitelistUpdated',
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
          indexed: false,
          internalType: 'bool',
          name: 'setCheck',
          type: 'bool',
        },
      ],
      name: 'SetImplementationsCheck',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'rewardsPerSecondLimit',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'timeForEmissionsLimit',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: '_numServicesLimit',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'emissionsLimit',
          type: 'uint256',
        },
      ],
      name: 'StakingLimitsUpdated',
      type: 'event',
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
          internalType: 'uint256',
          name: '_rewardsPerSecondLimit',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_timeForEmissionsLimit',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_numServicesLimit',
          type: 'uint256',
        },
      ],
      name: 'changeStakingLimits',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'emissionsLimit',
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
          name: '',
          type: 'address',
        },
      ],
      name: 'getEmissionsAmountLimit',
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
      name: 'implementationsCheck',
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
          name: '',
          type: 'address',
        },
      ],
      name: 'mapImplementations',
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
      inputs: [],
      name: 'numServicesLimit',
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
      name: 'olas',
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
      inputs: [],
      name: 'rewardsPerSecondLimit',
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
          internalType: 'bool',
          name: 'setCheck',
          type: 'bool',
        },
      ],
      name: 'setImplementationsCheck',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address[]',
          name: 'implementations',
          type: 'address[]',
        },
        {
          internalType: 'bool[]',
          name: 'statuses',
          type: 'bool[]',
        },
        {
          internalType: 'bool',
          name: 'setCheck',
          type: 'bool',
        },
      ],
      name: 'setImplementationsStatuses',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'timeForEmissionsLimit',
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
          name: 'implementation',
          type: 'address',
        },
      ],
      name: 'verifyImplementation',
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
        {
          internalType: 'address',
          name: 'implementation',
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
  ],
};
