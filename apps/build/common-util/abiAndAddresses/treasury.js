export const TREASURY = {
  contractName: 'Treasury',
  addresses: {
    1: '0xa0DA53447C0f6C4987964d8463da7e6628B30f82',
    5: '0x7bedCA17D29e53C8062d10902a6219F8d1E3B9B5',
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
          name: '_depository',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_dispenser',
          type: 'address',
        },
      ],
      stateMutability: 'payable',
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
          name: 'account',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
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
          name: 'olasAmount',
          type: 'uint256',
        },
      ],
      name: 'DepositTokenFromAccount',
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
          name: 'token',
          type: 'address',
        },
      ],
      name: 'DisableToken',
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
          name: 'sender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'serviceIds',
          type: 'uint256[]',
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'amounts',
          type: 'uint256[]',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'donation',
          type: 'uint256',
        },
      ],
      name: 'DonateToServicesETH',
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
      ],
      name: 'EnableToken',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'MinAcceptedETHUpdated',
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
      inputs: [],
      name: 'PauseTreasury',
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
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'ReceiveETH',
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
      inputs: [],
      name: 'UnpauseTreasury',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'ETHOwned',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'ETHFromServices',
          type: 'uint256',
        },
      ],
      name: 'UpdateTreasuryBalances',
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
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'tokenAmount',
          type: 'uint256',
        },
      ],
      name: 'Withdraw',
      type: 'event',
    },
    {
      inputs: [],
      name: 'ETHFromServices',
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
      name: 'ETHOwned',
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
      name: 'ETH_TOKEN_ADDRESS',
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
          name: '_tokenomics',
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
          internalType: 'uint256',
          name: '_minAcceptedETH',
          type: 'uint256',
        },
      ],
      name: 'changeMinAcceptedETH',
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
          name: 'serviceIds',
          type: 'uint256[]',
        },
        {
          internalType: 'uint256[]',
          name: 'amounts',
          type: 'uint256[]',
        },
      ],
      name: 'depositServiceDonationsETH',
      outputs: [],
      stateMutability: 'payable',
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
          internalType: 'uint256',
          name: 'tokenAmount',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'olasMintAmount',
          type: 'uint256',
        },
      ],
      name: 'depositTokenForOLAS',
      outputs: [],
      stateMutability: 'nonpayable',
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
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'disableToken',
      outputs: [],
      stateMutability: 'nonpayable',
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
      name: 'drainServiceSlashedFunds',
      outputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
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
      ],
      name: 'enableToken',
      outputs: [],
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
      ],
      name: 'isEnabled',
      outputs: [
        {
          internalType: 'bool',
          name: 'enabled',
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
      name: 'mapEnabledTokens',
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
      name: 'mapTokenReserves',
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
      name: 'minAcceptedETH',
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
      inputs: [],
      name: 'pause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'paused',
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
      inputs: [
        {
          internalType: 'uint256',
          name: 'treasuryRewards',
          type: 'uint256',
        },
      ],
      name: 'rebalanceTreasury',
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
      name: 'unpause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenAmount',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'withdraw',
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
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'accountRewards',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'accountTopUps',
          type: 'uint256',
        },
      ],
      name: 'withdrawToAccount',
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
      stateMutability: 'payable',
      type: 'receive',
    },
  ],
};
