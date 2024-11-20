export const DEPOSITORY = {
  contractName: 'Depository',
  addresses: {
    1: '0xfF8697d8d2998d6AA2e09B405795C6F4BEeB0C81',
    5: '0x5FDc466f4A7547c876eF40CD30fFA2A89F1EcDE7',
  },
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_olas',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_tokenomics',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_treasury',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_bondCalculator',
          type: 'address',
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
          name: 'bondCalculator',
          type: 'address',
        },
      ],
      name: 'BondCalculatorUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'supply',
          type: 'uint256',
        },
      ],
      name: 'CloseProduct',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'bondId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amountOLAS',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'tokenAmount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'maturity',
          type: 'uint256',
        },
      ],
      name: 'CreateBond',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'supply',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'priceLP',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'vesting',
          type: 'uint256',
        },
      ],
      name: 'CreateProduct',
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
          name: 'productId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'bondId',
          type: 'uint256',
        },
      ],
      name: 'RedeemBond',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'tokenomics',
          type: 'address',
        },
      ],
      name: 'TokenomicsUpdated',
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
      name: 'MIN_VESTING',
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
      name: 'bondCalculator',
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
      name: 'bondCounter',
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
          internalType: 'address',
          name: '_bondCalculator',
          type: 'address',
        },
      ],
      name: 'changeBondCalculator',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_tokenomics',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_treasury',
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
          internalType: 'uint256[]',
          name: 'productIds',
          type: 'uint256[]',
        },
      ],
      name: 'close',
      outputs: [
        {
          internalType: 'uint256[]',
          name: 'closedProductIds',
          type: 'uint256[]',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'priceLP',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'supply',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'vesting',
          type: 'uint256',
        },
      ],
      name: 'create',
      outputs: [
        {
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'tokenAmount',
          type: 'uint256',
        },
      ],
      name: 'deposit',
      outputs: [
        {
          internalType: 'uint256',
          name: 'payout',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'maturity',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'bondId',
          type: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'bondId',
          type: 'uint256',
        },
      ],
      name: 'getBondStatus',
      outputs: [
        {
          internalType: 'uint256',
          name: 'payout',
          type: 'uint256',
        },
        {
          internalType: 'bool',
          name: 'matured',
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
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'bool',
          name: 'matured',
          type: 'bool',
        },
      ],
      name: 'getBonds',
      outputs: [
        {
          internalType: 'uint256[]',
          name: 'bondIds',
          type: 'uint256[]',
        },
        {
          internalType: 'uint256',
          name: 'payout',
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
          name: 'token',
          type: 'address',
        },
      ],
      name: 'getCurrentPriceLP',
      outputs: [
        {
          internalType: 'uint256',
          name: 'priceLP',
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
          name: 'active',
          type: 'bool',
        },
      ],
      name: 'getProducts',
      outputs: [
        {
          internalType: 'uint256[]',
          name: 'productIds',
          type: 'uint256[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'productId',
          type: 'uint256',
        },
      ],
      name: 'isActiveProduct',
      outputs: [
        {
          internalType: 'bool',
          name: 'status',
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
      ],
      name: 'mapBondProducts',
      outputs: [
        {
          internalType: 'uint160',
          name: 'priceLP',
          type: 'uint160',
        },
        {
          internalType: 'uint32',
          name: 'vesting',
          type: 'uint32',
        },
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'uint96',
          name: 'supply',
          type: 'uint96',
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
      name: 'mapUserBonds',
      outputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint96',
          name: 'payout',
          type: 'uint96',
        },
        {
          internalType: 'uint32',
          name: 'maturity',
          type: 'uint32',
        },
        {
          internalType: 'uint32',
          name: 'productId',
          type: 'uint32',
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
      name: 'productCounter',
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
          internalType: 'uint256[]',
          name: 'bondIds',
          type: 'uint256[]',
        },
      ],
      name: 'redeem',
      outputs: [
        {
          internalType: 'uint256',
          name: 'payout',
          type: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'tokenomics',
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
  ],
};
