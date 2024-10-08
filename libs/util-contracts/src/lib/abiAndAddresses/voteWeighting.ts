import { Contract } from './types';

export const VOTE_WEIGHTING: Contract = {
  contractName: 'VoteWeighting',
  addresses: {
    1: '0x95418b46d5566D3d1ea62C12Aea91227E566c5c1',
  },
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_ve',
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
          name: 'account',
          type: 'address',
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
      name: 'LockExpired',
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
          internalType: 'int128',
          name: 'slope',
          type: 'int128',
        },
      ],
      name: 'NegativeSlope',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'NomineeAlreadyExists',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'NomineeDoesNotExist',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'NomineeNotRemoved',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'NomineeRemoved',
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
          name: 'provided',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'expected',
          type: 'uint256',
        },
      ],
      name: 'Underflow',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'voter',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'curTime',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'nextAllowedVotingTime',
          type: 'uint256',
        },
      ],
      name: 'VoteTooOften',
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
          indexed: true,
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
      ],
      name: 'AddNominee',
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
          name: 'sumBias',
          type: 'uint256',
        },
      ],
      name: 'Checkpoint',
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
          internalType: 'bytes32',
          name: 'nomineeAccount',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'nomineeWeight',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'totalSum',
          type: 'uint256',
        },
      ],
      name: 'CheckpointNominee',
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
          indexed: true,
          internalType: 'bytes32',
          name: 'nomineeAccount',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'nomineeWeight',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'totalSum',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'relativeWeight',
          type: 'uint256',
        },
      ],
      name: 'NomineeRelativeWeightWrite',
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
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'newSum',
          type: 'uint256',
        },
      ],
      name: 'RemoveNominee',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'user',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'nominee',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'weight',
          type: 'uint256',
        },
      ],
      name: 'VoteForNominee',
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
      inputs: [],
      name: 'MAX_NUM_WEEKS',
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
      name: 'MAX_WEIGHT',
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
      name: 'WEEK',
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
      name: 'WEIGHT_VOTE_DELAY',
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
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'addNomineeEVM',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'addNomineeNonEVM',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newDispenser',
          type: 'address',
        },
      ],
      name: 'changeDispenser',
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
          name: '',
          type: 'uint256',
        },
      ],
      name: 'changesSum',
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
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'changesWeight',
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
      name: 'checkpoint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'checkpointNominee',
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
      name: 'getAllNominees',
      outputs: [
        {
          components: [
            {
              internalType: 'bytes32',
              name: 'account',
              type: 'bytes32',
            },
            {
              internalType: 'uint256',
              name: 'chainId',
              type: 'uint256',
            },
          ],
          internalType: 'struct Nominee[]',
          name: '',
          type: 'tuple[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getAllRemovedNominees',
      outputs: [
        {
          components: [
            {
              internalType: 'bytes32',
              name: 'account',
              type: 'bytes32',
            },
            {
              internalType: 'uint256',
              name: 'chainId',
              type: 'uint256',
            },
          ],
          internalType: 'struct Nominee[]',
          name: '',
          type: 'tuple[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32[]',
          name: 'accounts',
          type: 'bytes32[]',
        },
        {
          internalType: 'uint256[]',
          name: 'chainIds',
          type: 'uint256[]',
        },
        {
          internalType: 'address[]',
          name: 'voters',
          type: 'address[]',
        },
      ],
      name: 'getNextAllowedVotingTimes',
      outputs: [
        {
          internalType: 'uint256[]',
          name: 'nextAllowedVotingTimes',
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
          name: 'id',
          type: 'uint256',
        },
      ],
      name: 'getNominee',
      outputs: [
        {
          components: [
            {
              internalType: 'bytes32',
              name: 'account',
              type: 'bytes32',
            },
            {
              internalType: 'uint256',
              name: 'chainId',
              type: 'uint256',
            },
          ],
          internalType: 'struct Nominee',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'getNomineeId',
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
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'getNomineeWeight',
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
      name: 'getNumNominees',
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
      name: 'getNumRemovedNominees',
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
          name: 'id',
          type: 'uint256',
        },
      ],
      name: 'getRemovedNominee',
      outputs: [
        {
          components: [
            {
              internalType: 'bytes32',
              name: 'account',
              type: 'bytes32',
            },
            {
              internalType: 'uint256',
              name: 'chainId',
              type: 'uint256',
            },
          ],
          internalType: 'struct Nominee',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'getRemovedNomineeId',
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
      name: 'getWeightsSum',
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
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      name: 'lastUserVote',
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
      name: 'mapNomineeIds',
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
      name: 'mapRemovedNominees',
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
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'time',
          type: 'uint256',
        },
      ],
      name: 'nomineeRelativeWeight',
      outputs: [
        {
          internalType: 'uint256',
          name: 'relativeWeight',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'totalSum',
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
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'time',
          type: 'uint256',
        },
      ],
      name: 'nomineeRelativeWeightWrite',
      outputs: [
        {
          internalType: 'uint256',
          name: 'relativeWeight',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'totalSum',
          type: 'uint256',
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
      inputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'pointsSum',
      outputs: [
        {
          internalType: 'uint256',
          name: 'bias',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'slope',
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
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'pointsWeight',
      outputs: [
        {
          internalType: 'uint256',
          name: 'bias',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'slope',
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
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'removeNominee',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      name: 'revokeRemovedNomineeVotingPower',
      outputs: [],
      stateMutability: 'nonpayable',
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
      name: 'setNominees',
      outputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
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
      name: 'setRemovedNominees',
      outputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'timeSum',
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
      name: 'timeWeight',
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
      inputs: [
        {
          internalType: 'bytes32',
          name: 'account',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'weight',
          type: 'uint256',
        },
      ],
      name: 'voteForNomineeWeights',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32[]',
          name: 'accounts',
          type: 'bytes32[]',
        },
        {
          internalType: 'uint256[]',
          name: 'chainIds',
          type: 'uint256[]',
        },
        {
          internalType: 'uint256[]',
          name: 'weights',
          type: 'uint256[]',
        },
      ],
      name: 'voteForNomineeWeightsBatch',
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
      name: 'voteUserPower',
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
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      name: 'voteUserSlopes',
      outputs: [
        {
          internalType: 'uint256',
          name: 'slope',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'power',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'end',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
};
