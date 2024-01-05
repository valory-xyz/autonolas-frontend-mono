export const TOKENOMICS = {
  contractName: 'TokenomicsProxy',
  addresses: {
    1: '0xc096362fa6f4A4B1a9ea68b1043416f3381ce300',
    5: '0x10100e74b7F706222F8A7C0be9FC7Ae1717Ad8B2',
  },
  abi: [
    {
      inputs: [],
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
          internalType: 'uint256',
          name: 'bondId',
          type: 'uint256',
        },
      ],
      name: 'BondNotRedeemable',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'reward',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'topUp',
          type: 'uint256',
        },
      ],
      name: 'ClaimIncentivesFailed',
      type: 'error',
    },
    {
      inputs: [],
      name: 'DelegatecallOnly',
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
      name: 'DonatorBlacklisted',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'provided',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'expected',
          type: 'uint256',
        },
      ],
      name: 'InsufficientAllowance',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'provided',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'expected',
          type: 'uint256',
        },
      ],
      name: 'LowerThan',
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
          name: 'manager',
          type: 'address',
        },
      ],
      name: 'ManagerOnly',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NonZeroValue',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'provided',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'max',
          type: 'uint256',
        },
      ],
      name: 'Overflow',
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
          internalType: 'uint256',
          name: 'x',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'y',
          type: 'uint256',
        },
      ],
      name: 'PRBMath_MulDiv18_Overflow',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'x',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'y',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'denominator',
          type: 'uint256',
        },
      ],
      name: 'PRBMath_MulDiv_Overflow',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'x',
          type: 'uint256',
        },
      ],
      name: 'PRBMath_UD60x18_Convert_Overflow',
      type: 'error',
    },
    {
      inputs: [],
      name: 'Paused',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
      ],
      name: 'ProductClosed',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'tokenAddress',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'deadline',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'curTime',
          type: 'uint256',
        },
      ],
      name: 'ProductExpired',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'tokenAddress',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'requested',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'actual',
          type: 'uint256',
        },
      ],
      name: 'ProductSupplyLow',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ReentrancyGuard',
      type: 'error',
    },
    {
      inputs: [],
      name: 'SameBlockNumberViolation',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'serviceId',
          type: 'uint256',
        },
      ],
      name: 'ServiceDoesNotExist',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'serviceId',
          type: 'uint256',
        },
      ],
      name: 'ServiceNeverDeployed',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'TransferFailed',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'epochNumber',
          type: 'uint256',
        },
      ],
      name: 'TreasuryRebalanceFailed',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'tokenAddress',
          type: 'address',
        },
      ],
      name: 'UnauthorizedToken',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'provided',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'expected',
          type: 'uint256',
        },
      ],
      name: 'WrongAmount',
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
          internalType: 'address',
          name: 'provided',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'expected',
          type: 'address',
        },
      ],
      name: 'WrongTokenAddress',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'unitId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'unitType',
          type: 'uint256',
        },
      ],
      name: 'WrongUnitId',
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
          internalType: 'address',
          name: 'agentRegistry',
          type: 'address',
        },
      ],
      name: 'AgentRegistryUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'componentRegistry',
          type: 'address',
        },
      ],
      name: 'ComponentRegistryUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'depository',
          type: 'address',
        },
      ],
      name: 'DepositoryUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'dispenser',
          type: 'address',
        },
      ],
      name: 'DispenserUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'blacklist',
          type: 'address',
        },
      ],
      name: 'DonatorBlacklistUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'effectiveBond',
          type: 'uint256',
        },
      ],
      name: 'EffectiveBondUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'epochLen',
          type: 'uint256',
        },
      ],
      name: 'EpochLengthUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'epochCounter',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'treasuryRewards',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'accountRewards',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'accountTopUps',
          type: 'uint256',
        },
      ],
      name: 'EpochSettled',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'idf',
          type: 'uint256',
        },
      ],
      name: 'IDFUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'epochNumber',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'rewardComponentFraction',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'rewardAgentFraction',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'maxBondFraction',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'topUpComponentFraction',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'topUpAgentFraction',
          type: 'uint256',
        },
      ],
      name: 'IncentiveFractionsUpdateRequested',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'epochNumber',
          type: 'uint256',
        },
      ],
      name: 'IncentiveFractionsUpdated',
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
          name: 'serviceRegistry',
          type: 'address',
        },
      ],
      name: 'ServiceRegistryUpdated',
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
      name: 'TokenomicsImplementationUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'epochNumber',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'devsPerCapital',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'codePerDev',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'epsilonRate',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'epochLen',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'veOLASThreshold',
          type: 'uint256',
        },
      ],
      name: 'TokenomicsParametersUpdateRequested',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'epochNumber',
          type: 'uint256',
        },
      ],
      name: 'TokenomicsParametersUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'treasury',
          type: 'address',
        },
      ],
      name: 'TreasuryUpdated',
      type: 'event',
    },
    {
      inputs: [],
      name: 'MIN_EPOCH_LENGTH',
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
      name: 'MIN_PARAM_VALUE',
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
      name: 'ONE_YEAR',
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
      name: 'PROXY_TOKENOMICS',
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
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256[]',
          name: 'unitTypes',
          type: 'uint256[]',
        },
        {
          internalType: 'uint256[]',
          name: 'unitIds',
          type: 'uint256[]',
        },
      ],
      name: 'accountOwnerIncentives',
      outputs: [
        {
          internalType: 'uint256',
          name: 'reward',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'topUp',
          type: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'agentRegistry',
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
          name: '_donatorBlacklist',
          type: 'address',
        },
      ],
      name: 'changeDonatorBlacklist',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '_rewardComponentFraction',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_rewardAgentFraction',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_maxBondFraction',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_topUpComponentFraction',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_topUpAgentFraction',
          type: 'uint256',
        },
      ],
      name: 'changeIncentiveFractions',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_treasury',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_depository',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_dispenser',
          type: 'address',
        },
      ],
      name: 'changeManagers',
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
          name: '_componentRegistry',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_agentRegistry',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_serviceRegistry',
          type: 'address',
        },
      ],
      name: 'changeRegistries',
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
      ],
      name: 'changeTokenomicsImplementation',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '_devsPerCapital',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_codePerDev',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_epsilonRate',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_epochLen',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_veOLASThreshold',
          type: 'uint256',
        },
      ],
      name: 'changeTokenomicsParameters',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'checkpoint',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'codePerDev',
      outputs: [
        {
          internalType: 'uint72',
          name: '',
          type: 'uint72',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'componentRegistry',
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
      name: 'currentYear',
      outputs: [
        {
          internalType: 'uint8',
          name: '',
          type: 'uint8',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'depository',
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
      name: 'devsPerCapital',
      outputs: [
        {
          internalType: 'uint72',
          name: '',
          type: 'uint72',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'dispenser',
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
      name: 'donatorBlacklist',
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
      name: 'effectiveBond',
      outputs: [
        {
          internalType: 'uint96',
          name: '',
          type: 'uint96',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'epochCounter',
      outputs: [
        {
          internalType: 'uint32',
          name: '',
          type: 'uint32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'epochLen',
      outputs: [
        {
          internalType: 'uint32',
          name: '',
          type: 'uint32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'epsilonRate',
      outputs: [
        {
          internalType: 'uint64',
          name: '',
          type: 'uint64',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'epoch',
          type: 'uint256',
        },
      ],
      name: 'getIDF',
      outputs: [
        {
          internalType: 'uint256',
          name: 'idf',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'numYears',
          type: 'uint256',
        },
      ],
      name: 'getInflationForYear',
      outputs: [
        {
          internalType: 'uint256',
          name: 'inflationAmount',
          type: 'uint256',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getInflationPerEpoch',
      outputs: [
        {
          internalType: 'uint256',
          name: 'inflationPerEpoch',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getLastIDF',
      outputs: [
        {
          internalType: 'uint256',
          name: 'idf',
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
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256[]',
          name: 'unitTypes',
          type: 'uint256[]',
        },
        {
          internalType: 'uint256[]',
          name: 'unitIds',
          type: 'uint256[]',
        },
      ],
      name: 'getOwnerIncentives',
      outputs: [
        {
          internalType: 'uint256',
          name: 'reward',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'topUp',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'numYears',
          type: 'uint256',
        },
      ],
      name: 'getSupplyCapForYear',
      outputs: [
        {
          internalType: 'uint256',
          name: 'supplyCap',
          type: 'uint256',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'epoch',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'unitType',
          type: 'uint256',
        },
      ],
      name: 'getUnitPoint',
      outputs: [
        {
          components: [
            {
              internalType: 'uint96',
              name: 'sumUnitTopUpsOLAS',
              type: 'uint96',
            },
            {
              internalType: 'uint32',
              name: 'numNewUnits',
              type: 'uint32',
            },
            {
              internalType: 'uint8',
              name: 'rewardUnitFraction',
              type: 'uint8',
            },
            {
              internalType: 'uint8',
              name: 'topUpUnitFraction',
              type: 'uint8',
            },
          ],
          internalType: 'struct UnitPoint',
          name: 'up',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'inflationPerSecond',
      outputs: [
        {
          internalType: 'uint96',
          name: '',
          type: 'uint96',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_olas',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_treasury',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_depository',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_dispenser',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_ve',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: '_epochLen',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: '_componentRegistry',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_agentRegistry',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_serviceRegistry',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_donatorBlacklist',
          type: 'address',
        },
      ],
      name: 'initializeTokenomics',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'lastDonationBlockNumber',
      outputs: [
        {
          internalType: 'uint32',
          name: '',
          type: 'uint32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'mapEpochTokenomics',
      outputs: [
        {
          components: [
            {
              internalType: 'uint96',
              name: 'totalDonationsETH',
              type: 'uint96',
            },
            {
              internalType: 'uint96',
              name: 'totalTopUpsOLAS',
              type: 'uint96',
            },
            {
              internalType: 'uint64',
              name: 'idf',
              type: 'uint64',
            },
            {
              internalType: 'uint32',
              name: 'numNewOwners',
              type: 'uint32',
            },
            {
              internalType: 'uint32',
              name: 'endTime',
              type: 'uint32',
            },
            {
              internalType: 'uint8',
              name: 'rewardTreasuryFraction',
              type: 'uint8',
            },
            {
              internalType: 'uint8',
              name: 'maxBondFraction',
              type: 'uint8',
            },
          ],
          internalType: 'struct EpochPoint',
          name: 'epochPoint',
          type: 'tuple',
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
      name: 'mapNewOwners',
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
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'mapNewUnits',
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
      name: 'mapOwnerRewards',
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
      name: 'mapOwnerTopUps',
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
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'mapServiceAmounts',
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
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'mapUnitIncentives',
      outputs: [
        {
          internalType: 'uint96',
          name: 'reward',
          type: 'uint96',
        },
        {
          internalType: 'uint96',
          name: 'pendingRelativeReward',
          type: 'uint96',
        },
        {
          internalType: 'uint96',
          name: 'topUp',
          type: 'uint96',
        },
        {
          internalType: 'uint96',
          name: 'pendingRelativeTopUp',
          type: 'uint96',
        },
        {
          internalType: 'uint32',
          name: 'lastEpoch',
          type: 'uint32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'maxBond',
      outputs: [
        {
          internalType: 'uint96',
          name: '',
          type: 'uint96',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'nextEpochLen',
      outputs: [
        {
          internalType: 'uint32',
          name: '',
          type: 'uint32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'nextVeOLASThreshold',
      outputs: [
        {
          internalType: 'uint96',
          name: '',
          type: 'uint96',
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
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'refundFromBondProgram',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'reserveAmountForBondProgram',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
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
      name: 'timeLaunch',
      outputs: [
        {
          internalType: 'uint32',
          name: '',
          type: 'uint32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'tokenomicsImplementation',
      outputs: [
        {
          internalType: 'address',
          name: 'implementation',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'tokenomicsParametersUpdated',
      outputs: [
        {
          internalType: 'bytes1',
          name: '',
          type: 'bytes1',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'donator',
          type: 'address',
        },
        {
          internalType: 'uint256[]',
          name: 'serviceIds',
          type: 'uint256[]',
        },
        {
          internalType: 'uint256[]',
          name: 'amounts',
          type: 'uint256[]',
        },
        {
          internalType: 'uint256',
          name: 'donationETH',
          type: 'uint256',
        },
      ],
      name: 'trackServiceDonations',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'treasury',
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
      name: 've',
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
      name: 'veOLASThreshold',
      outputs: [
        {
          internalType: 'uint96',
          name: '',
          type: 'uint96',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
};
