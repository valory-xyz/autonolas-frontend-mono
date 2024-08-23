export const DISPENSER = {
  contractName: 'Dispenser',
  addresses: {
    1: '0x5650300fCBab43A0D7D02F8Cb5d0f039402593f0',
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
          name: '_voteWeighting',
          type: 'address',
        },
        {
          internalType: 'bytes32',
          name: '_retainer',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: '_maxNumClaimingEpochs',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_maxNumStakingTargets',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_defaultMinStakingWeight',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_defaultMaxStakingIncentive',
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
      inputs: [
        {
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'depositProcessor',
          type: 'address',
        },
      ],
      name: 'DepositProcessorOnly',
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
      inputs: [],
      name: 'ReentrancyGuard',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
      ],
      name: 'WrongAccount',
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
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'WrongChainId',
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
          internalType: 'bytes32',
          name: 'nomineeHash',
          type: 'bytes32',
        },
      ],
      name: 'AddNomineeHash',
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
        {
          indexed: false,
          internalType: 'uint256',
          name: 'reward',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'topUp',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'unitTypes',
          type: 'uint256[]',
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'unitIds',
          type: 'uint256[]',
        },
      ],
      name: 'IncentivesClaimed',
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
          internalType: 'enum Dispenser.Pause',
          name: 'pauseState',
          type: 'uint8',
        },
      ],
      name: 'PauseDispenser',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'nomineeHash',
          type: 'bytes32',
        },
      ],
      name: 'RemoveNomineeHash',
      type: 'event',
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
          indexed: false,
          internalType: 'uint256',
          name: 'returnAmount',
          type: 'uint256',
        },
      ],
      name: 'Retained',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address[]',
          name: 'depositProcessors',
          type: 'address[]',
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'chainIds',
          type: 'uint256[]',
        },
      ],
      name: 'SetDepositProcessorChainIds',
      type: 'event',
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
          indexed: false,
          internalType: 'uint256[]',
          name: 'chainIds',
          type: 'uint256[]',
        },
        {
          indexed: false,
          internalType: 'bytes32[][]',
          name: 'stakingTargets',
          type: 'bytes32[][]',
        },
        {
          indexed: false,
          internalType: 'uint256[][]',
          name: 'stakingIncentives',
          type: 'uint256[][]',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'totalStakingIncentive',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'totalTransferAmount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'totalReturnAmount',
          type: 'uint256',
        },
      ],
      name: 'StakingIncentivesBatchClaimed',
      type: 'event',
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
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'bytes32',
          name: 'stakingTarget',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'stakingIncentive',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'transferAmount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'returnAmount',
          type: 'uint256',
        },
      ],
      name: 'StakingIncentivesClaimed',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'maxNumClaimingEpochs',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'maxNumStakingTargets',
          type: 'uint256',
        },
      ],
      name: 'StakingParamsUpdated',
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
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'voteWeighting',
          type: 'address',
        },
      ],
      name: 'VoteWeightingUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'updatedWithheldAmount',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'batchHash',
          type: 'bytes32',
        },
      ],
      name: 'WithheldAmountSynced',
      type: 'event',
    },
    {
      inputs: [],
      name: 'MAX_EVM_CHAIN_ID',
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
          internalType: 'bytes32',
          name: 'nomineeHash',
          type: 'bytes32',
        },
      ],
      name: 'addNominee',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'numClaimedEpochs',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'stakingTarget',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'bridgingDecimals',
          type: 'uint256',
        },
      ],
      name: 'calculateStakingIncentives',
      outputs: [
        {
          internalType: 'uint256',
          name: 'totalStakingIncentive',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'totalReturnAmount',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'lastClaimedEpoch',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'nomineeHash',
          type: 'bytes32',
        },
      ],
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
        {
          internalType: 'address',
          name: '_voteWeighting',
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
          internalType: 'uint256',
          name: '_maxNumClaimingEpochs',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_maxNumStakingTargets',
          type: 'uint256',
        },
      ],
      name: 'changeStakingParams',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
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
      name: 'claimOwnerIncentives',
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
      inputs: [
        {
          internalType: 'uint256',
          name: 'numClaimedEpochs',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'stakingTarget',
          type: 'bytes32',
        },
        {
          internalType: 'bytes',
          name: 'bridgePayload',
          type: 'bytes',
        },
      ],
      name: 'claimStakingIncentives',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'numClaimedEpochs',
          type: 'uint256',
        },
        {
          internalType: 'uint256[]',
          name: 'chainIds',
          type: 'uint256[]',
        },
        {
          internalType: 'bytes32[][]',
          name: 'stakingTargets',
          type: 'bytes32[][]',
        },
        {
          internalType: 'bytes[]',
          name: 'bridgePayloads',
          type: 'bytes[]',
        },
        {
          internalType: 'uint256[]',
          name: 'valueAmounts',
          type: 'uint256[]',
        },
      ],
      name: 'claimStakingIncentivesBatch',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'defaultMaxStakingIncentive',
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
      name: 'defaultMinStakingWeight',
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
      name: 'mapChainIdDepositProcessors',
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
          name: '',
          type: 'uint256',
        },
      ],
      name: 'mapChainIdWithheldAmounts',
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
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      name: 'mapLastClaimedStakingEpochs',
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
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      name: 'mapRemovedNomineeEpochs',
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
      name: 'mapZeroWeightEpochRefunded',
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
      name: 'maxNumClaimingEpochs',
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
      name: 'maxNumStakingTargets',
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
      name: 'paused',
      outputs: [
        {
          internalType: 'enum Dispenser.Pause',
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
          internalType: 'bytes32',
          name: 'nomineeHash',
          type: 'bytes32',
        },
      ],
      name: 'removeNominee',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'retain',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'retainer',
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
      name: 'retainerHash',
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
          internalType: 'address[]',
          name: 'depositProcessors',
          type: 'address[]',
        },
        {
          internalType: 'uint256[]',
          name: 'chainIds',
          type: 'uint256[]',
        },
      ],
      name: 'setDepositProcessorChainIds',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'enum Dispenser.Pause',
          name: 'pauseState',
          type: 'uint8',
        },
      ],
      name: 'setPauseState',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'batchHash',
          type: 'bytes32',
        },
      ],
      name: 'syncWithheldAmount',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'batchHash',
          type: 'bytes32',
        },
      ],
      name: 'syncWithheldAmountMaintenance',
      outputs: [],
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
    {
      inputs: [],
      name: 'voteWeighting',
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
