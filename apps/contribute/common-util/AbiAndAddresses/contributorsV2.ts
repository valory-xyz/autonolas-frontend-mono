export const CONTRIBUTORS_V2_ADDRESS_BASE = '0x343F2B005cF6D70bA610CD9F1F1927049414B582';

export const CONTRIBUTORS_V2_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_serviceManager',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_olas',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_stakingFactory',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_agentId',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: '_configHash',
        type: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'AlreadyInitialized',
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
    inputs: [],
    name: 'ReentrancyGuard',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
    ],
    name: 'ServiceAlreadyStaked',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
    ],
    name: 'ServiceNotDefined',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'UnauthorizedAccount',
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
    ],
    name: 'WrongServiceSetup',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'state',
        type: 'uint8',
      },
    ],
    name: 'WrongServiceState',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'WrongStakingInstance',
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
        indexed: true,
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'serviceOwner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'Claimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'serviceOwner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'CreatedAndStaked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'ImplementationUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'senderAgent',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'multisigs',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'activityChanges',
        type: 'uint256[]',
      },
    ],
    name: 'MultisigActivityChanged',
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
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'serviceOwner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'Restaked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'safeMultisig',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'safeSameAddressMultisig',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'fallbackHandler',
        type: 'address',
      },
    ],
    name: 'SafeContractsChanged',
    type: 'event',
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
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
    ],
    name: 'ServicePulled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address[]',
        name: 'contributeServices',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'bool[]',
        name: 'statuses',
        type: 'bool[]',
      },
    ],
    name: 'SetContributeServiceStatuses',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'serviceOwner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'Staked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'serviceOwner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'Unstaked',
    type: 'event',
  },
  {
    inputs: [],
    name: 'CONTRIBUTORS_PROXY',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'NUM_AGENT_INSTANCES',
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
    name: 'THRESHOLD',
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
    name: 'VERSION',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'agentId',
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
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'changeImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
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
        name: 'newSafeMultisig',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'newSafeSameAddressMultisig',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'newFallbackHandler',
        type: 'address',
      },
    ],
    name: 'changeSafeContracts',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claim',
    outputs: [
      {
        internalType: 'uint256',
        name: 'reward',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'configHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'createAndStake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fallbackHandler',
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
        internalType: 'address[]',
        name: 'multisigs',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'activityChanges',
        type: 'uint256[]',
      },
    ],
    name: 'increaseActivity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_safeMultisig',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_safeSameAddressMultisig',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_fallbackHandler',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
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
    name: 'mapAccountServiceInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'multisig',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'stakingInstance',
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
    name: 'mapContributeAgents',
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
    name: 'mapMutisigActivities',
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
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'onERC721Received',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
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
    name: 'pullUnbondedService',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'nextStakingInstance',
        type: 'address',
      },
    ],
    name: 'reStake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'safeMultisig',
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
    name: 'safeSameAddressMultisig',
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
    name: 'serviceManager',
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
    name: 'serviceRegistry',
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
    name: 'serviceRegistryTokenUtility',
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
        internalType: 'address[]',
        name: 'contributeServices',
        type: 'address[]',
      },
      {
        internalType: 'bool[]',
        name: 'statuses',
        type: 'bool[]',
      },
    ],
    name: 'setContributeServiceStatuses',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'socialId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'serviceId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'stakingInstance',
        type: 'address',
      },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'stakingFactory',
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
        internalType: 'bool',
        name: 'pullService',
        type: 'bool',
      },
    ],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
