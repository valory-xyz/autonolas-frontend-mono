export const DELEGATE_CONTRIBUTE_ADDRESS_MAINNET = '0x2F1eA3bc39F1a052460cac722e64c1F89c3c1e68';

export const DELEGATE_CONTRIBUTE_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_veOLAS', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { internalType: 'address', name: 'delegator', type: 'address' },
      { internalType: 'address', name: 'delegatee', type: 'address' },
    ],
    name: 'AlreadyDelegatedToSameDelegatee',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'delegator', type: 'address' }],
    name: 'NoBalance',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'delegator', type: 'address' }],
    name: 'NoSelfDelegation',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'delegator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'delegatee',
        type: 'address',
      },
    ],
    name: 'Delegation',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: 'delegatee', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'delegatee', type: 'address' }],
    name: 'getDelegatorList',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'mapDelegation',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'veOLAS',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'delegatee', type: 'address' }],
    name: 'votingPower',
    outputs: [{ internalType: 'uint256', name: 'totalVotingPower', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
