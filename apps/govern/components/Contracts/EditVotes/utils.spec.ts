import { Allocation, StakingContract, UserVotes } from 'types';
import { Address } from 'viem';

import { getReorderedVotes } from './utils';

// in weight 30 = 30%
const allocations: Allocation[] = [
  {
    address: '0x1',
    chainId: 1,
    metadata: { name: 'Contract1', description: 'Desc1' },
    weight: 30,
  },
  {
    address: '0x2',
    chainId: 1,
    metadata: { name: 'Contract2', description: 'Desc2' },
    weight: 10,
  },
  {
    address: '0x5',
    chainId: 1,
    metadata: { name: 'Contract5', description: 'Desc5' },
    weight: 60,
  },
];

// in power 8000 = 80%
const userVotes: Record<Address, UserVotes> = {
  '0x2': {
    current: { slope: 1, power: 8000, end: 1000 },
    next: { slope: 1, power: 8000, end: 1000 },
    chainId: 1,
  },
  '0x3': {
    current: { slope: 1, power: 500, end: 500 },
    next: { slope: 1, power: 500, end: 500 },
    chainId: 1,
  },
  '0x5': {
    current: { slope: 1, power: 1000, end: 1000 },
    next: { slope: 1, power: 1000, end: 1000 },
    chainId: 1,
  },
};

const stakingContracts: StakingContract[] = [
  {
    address: '0x1',
    chainId: 1,
    metadata: { name: 'Contract1', description: 'Desc1' },
    currentWeight: { percentage: 30, value: 3000 },
    nextWeight: { percentage: 60, value: 6000 },
  },
  {
    address: '0x2',
    chainId: 1,
    metadata: { name: 'Contract2', description: 'Desc2' },
    currentWeight: { percentage: 10, value: 1000 },
    nextWeight: { percentage: 20, value: 2000 },
  },
  {
    address: '0x3',
    chainId: 1,
    metadata: { name: 'Contract3', description: 'Desc3' },
    currentWeight: { percentage: 20, value: 2000 },
    nextWeight: { percentage: 40, value: 4000 },
  },
  {
    address: '0x5',
    chainId: 1,
    metadata: { name: 'Contract5', description: 'Desc5' },
    currentWeight: { percentage: 5, value: 500 },
    nextWeight: { percentage: 10, value: 1000 },
  },
];

describe('getReorderedVotes()', () => {
  it('should handle empty allocations', () => {
    const result = getReorderedVotes([], userVotes, stakingContracts);
    expect(result).toEqual([
      {
        address: '0x2',
        chainId: 1,
        weight: '0',
        metadata: { name: 'Contract2', description: 'Desc2' },
      },
      {
        address: '0x5',
        chainId: 1,
        weight: '0',
        metadata: { name: 'Contract5', description: 'Desc5' },
      },
      {
        address: '0x3',
        chainId: 1,
        weight: '0',
        metadata: { name: 'Contract3', description: 'Desc3' },
      },
    ]);
  });

  it('should handle empty userVotes', () => {
    const result = getReorderedVotes(allocations, {}, stakingContracts);
    expect(result).toEqual([
      {
        address: '0x2',
        chainId: 1,
        weight: '1000',
        metadata: { name: 'Contract2', description: 'Desc2' },
      },
      {
        address: '0x1',
        chainId: 1,
        weight: '3000',
        metadata: { name: 'Contract1', description: 'Desc1' },
      },
      {
        address: '0x5',
        chainId: 1,
        weight: '6000',
        metadata: { name: 'Contract5', description: 'Desc5' },
      },
    ]);
  });

  it('should handle empty stakingContracts', () => {
    const result = getReorderedVotes(allocations, userVotes, []);
    expect(result).toEqual([
      {
        address: '0x2',
        chainId: 1,
        weight: '1000',
        metadata: { name: 'Contract2', description: 'Desc2' },
      },
      {
        address: '0x5',
        chainId: 1,
        weight: '6000',
        metadata: { name: 'Contract5', description: 'Desc5' },
      },
      {
        address: '0x1',
        chainId: 1,
        weight: '3000',
        metadata: { name: 'Contract1', description: 'Desc1' },
      },
    ]);
  });

  it('should handle no matching new votes', () => {
    const newAllocations: Allocation[] = [
      {
        address: '0x4',
        chainId: 1,
        metadata: { name: 'Contract4', description: 'Desc4' },
        weight: 20,
      },
    ];
    const result = getReorderedVotes(newAllocations, userVotes, stakingContracts);
    expect(result).toEqual([
      {
        address: '0x2',
        chainId: 1,
        weight: '0',
        metadata: { name: 'Contract2', description: 'Desc2' },
      },
      {
        address: '0x5',
        chainId: 1,
        weight: '0',
        metadata: { name: 'Contract5', description: 'Desc5' },
      },
      {
        address: '0x3',
        chainId: 1,
        weight: '0',
        metadata: { name: 'Contract3', description: 'Desc3' },
      },
      {
        address: '0x4',
        chainId: 1,
        weight: '2000',
        metadata: { name: 'Contract4', description: 'Desc4' },
      },
    ]);
  });

  it('should reorder votes correctly', () => {
    const result = getReorderedVotes(allocations, userVotes, stakingContracts);
    expect(result).toEqual([
      {
        address: '0x3',
        chainId: 1,
        weight: '0',
        metadata: { name: 'Contract3', description: 'Desc3' },
      },
      {
        address: '0x2',
        chainId: 1,
        weight: '1000',
        metadata: { name: 'Contract2', description: 'Desc2' },
      },
      {
        address: '0x5',
        chainId: 1,
        weight: '6000',
        metadata: { name: 'Contract5', description: 'Desc5' },
      },
      {
        address: '0x1',
        chainId: 1,
        weight: '3000',
        metadata: { name: 'Contract1', description: 'Desc1' },
      },
    ]);
  });

  it('should reorder votes correctly for big list', () => {
    const userVotesBig: Record<Address, UserVotes> = {
      '0x2da9ae6f0c5e9ba561c1f92f265bbe80d753a538': {
        current: { slope: 1, power: 7, end: 1234 },
        next: { slope: 1, power: 7, end: 1234 },
        chainId: 100,
      },
      '0xbca056952d2a7a8dd4a002079219807cfdf9fd29': {
        current: { slope: 1, power: 10.5, end: 1234 },
        next: { slope: 1, power: 10.5, end: 1234 },
        chainId: 10,
      },
      '0x6891cf116f9a3bdbd1e89413118ef81f69d298c3': {
        current: { slope: 1, power: 24, end: 1234 },
        next: { slope: 1, power: 24, end: 1234 },
        chainId: 10,
      },
      '0xad9d891134443b443d7f30013c7e14fe27f2e029': {
        current: { slope: 1, power: 33, end: 1234 },
        next: { slope: 1, power: 33, end: 1234 },
        chainId: 100,
      },
      '0xe56df1e563de1b10715cb313d514af350d207212': {
        current: { slope: 1, power: 33, end: 1234 },
        next: { slope: 1, power: 33, end: 1234 },
        chainId: 100,
      },
      '0xd7a3c8b975f71030135f1a66e9e23164d54ff455': {
        current: { slope: 1, power: 33, end: 1234 },
        next: { slope: 1, power: 33, end: 1234 },
        chainId: 100,
      },
      '0x17dbae44bc5618cc254055b386a29576b4f87015': {
        current: { slope: 1, power: 48, end: 1234 },
        next: { slope: 1, power: 48, end: 1234 },
        chainId: 100,
      },
      '0xb0ef657b8302bd2c74b6e6d9b2b4b39145b19c6f': {
        current: { slope: 1, power: 48, end: 1234 },
        next: { slope: 1, power: 48, end: 1234 },
        chainId: 100,
      },
      '0x3112c1613eac3dbae3d4e38cef023eb9e2c91cf7': {
        current: { slope: 1, power: 48, end: 1234 },
        next: { slope: 1, power: 48, end: 1234 },
        chainId: 100,
      },
      '0x88eb38ff79fba8c19943c0e5acfa67d5876adcc1': {
        current: { slope: 1, power: 48, end: 1234 },
        next: { slope: 1, power: 48, end: 1234 },
        chainId: 100,
      },
      '0x6c65430515c70a3f5e62107cc301685b7d46f991': {
        current: { slope: 1, power: 48, end: 1234 },
        next: { slope: 1, power: 48, end: 1234 },
        chainId: 100,
      },
      '0x1430107a785c3a36a0c1fc0ee09b9631e2e72aff': {
        current: { slope: 1, power: 48, end: 1234 },
        next: { slope: 1, power: 48, end: 1234 },
        chainId: 100,
      },
      '0x041e679d04fc0d4f75eb937dea729df09a58e454': {
        current: { slope: 1, power: 48, end: 1234 },
        next: { slope: 1, power: 48, end: 1234 },
        chainId: 100,
      },
      '0x6c6d01e8ea8f806ef0c22f0ef7ed81d868c1ab39': {
        current: { slope: 1, power: 60, end: 1234 },
        next: { slope: 1, power: 60, end: 1234 },
        chainId: 100,
      },
      '0xcdc603e0ee55aae92519f9770f214b2be4967f7d': {
        current: { slope: 1, power: 60, end: 1234 },
        next: { slope: 1, power: 60, end: 1234 },
        chainId: 100,
      },
      '0x22d6cd3d587d8391c3aae83a783f26c67ab54a85': {
        current: { slope: 1, power: 60, end: 1234 },
        next: { slope: 1, power: 60, end: 1234 },
        chainId: 100,
      },
      '0xaaecdf4d0cbd6ca0622892ac6044472f3912a5f3': {
        current: { slope: 1, power: 60, end: 1234 },
        next: { slope: 1, power: 60, end: 1234 },
        chainId: 100,
      },
      '0x168aed532a0cd8868c22fc77937af78b363652b1': {
        current: { slope: 1, power: 60, end: 1234 },
        next: { slope: 1, power: 60, end: 1234 },
        chainId: 100,
      },
      '0xdda9cd214f12e7c2d58e871404a0a3b1177065c8': {
        current: { slope: 1, power: 60, end: 1234 },
        next: { slope: 1, power: 60, end: 1234 },
        chainId: 100,
      },
      '0x53a38655b4e659ef4c7f88a26fbf5c67932c7156': {
        current: { slope: 1, power: 60, end: 1234 },
        next: { slope: 1, power: 60, end: 1234 },
        chainId: 100,
      },
      '0x000000000000000000000000000000000000dead': {
        current: { slope: 1, power: 103.5, end: 1234 },
        next: { slope: 1, power: 103.5, end: 1234 },
        chainId: 1,
      },
    };

    const metaDefault = { name: 'Contract', description: 'Description' };
    const metaRetainer = { name: 'Retainer', description: 'Retainer' };
    const newAllocationsBig: Allocation[] = [
      {
        address: '0x6c6d01e8ea8f806ef0c22f0ef7ed81d868c1ab39',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0xcdc603e0ee55aae92519f9770f214b2be4967f7d',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x22d6cd3d587d8391c3aae83a783f26c67ab54a85',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0xaaecdf4d0cbd6ca0622892ac6044472f3912a5f3',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x168aed532a0cd8868c22fc77937af78b363652b1',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x88eb38ff79fba8c19943c0e5acfa67d5876adcc1',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x17dbae44bc5618cc254055b386a29576b4f87015',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0xb0ef657b8302bd2c74b6e6d9b2b4b39145b19c6f',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x3112c1613eac3dbae3d4e38cef023eb9e2c91cf7',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x1430107a785c3a36a0c1fc0ee09b9631e2e72aff',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x041e679d04fc0d4f75eb937dea729df09a58e454',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0xad9d891134443b443d7f30013c7e14fe27f2e029',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0xe56df1e563de1b10715cb313d514af350d207212',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0xd7a3c8b975f71030135f1a66e9e23164d54ff455',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x6891cf116f9a3bdbd1e89413118ef81f69d298c3',
        chainId: 10,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0xbca056952d2a7a8dd4a002079219807cfdf9fd29',
        chainId: 10,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x2da9ae6f0c5e9ba561c1f92f265bbe80d753a538',
        chainId: 100,
        metadata: metaDefault,
        weight: 0,
      },
      {
        address: '0x000000000000000000000000000000000000dead',
        chainId: 1,
        metadata: metaRetainer,
        weight: 94.3,
      },
      {
        address: '0xdda9cd214f12e7c2d58e871404a0a3b1177065c8',
        chainId: 100,
        metadata: metaDefault,
        weight: 1.8,
      },
      {
        address: '0x53a38655b4e659ef4c7f88a26fbf5c67932c7156',
        chainId: 100,
        metadata: metaDefault,
        weight: 1.8,
      },
      {
        address: '0x6c65430515c70a3f5e62107cc301685b7d46f991',
        chainId: 100,
        metadata: metaDefault,
        weight: 0.7,
      },
      // newly added addresses
      {
        address: '0x22fa631064a99c43196ec5f8324b73211ced98f9',
        chainId: 100,
        metadata: metaDefault,
        weight: 0.7,
      },
      {
        address: '0xb93607d2173f847a18567809db51345d4ea38bad',
        chainId: 8453,
        metadata: metaDefault,
        weight: 0.7,
      },
    ];
    const stakingContractsBig = newAllocationsBig.map((a) => ({
      address: a.address,
      chainId: a.chainId,
      metadata:
        a.address === '0x000000000000000000000000000000000000dead' ? metaRetainer : metaDefault,
      currentWeight: { percentage: 0, value: 0 },
      nextWeight: { percentage: 0, value: 0 },
    }));

    const expectedResult = [
      {
        address: '0x6c6d01e8ea8f806ef0c22f0ef7ed81d868c1ab39',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0xcdc603e0ee55aae92519f9770f214b2be4967f7d',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x22d6cd3d587d8391c3aae83a783f26c67ab54a85',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0xaaecdf4d0cbd6ca0622892ac6044472f3912a5f3',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x168aed532a0cd8868c22fc77937af78b363652b1',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x17dbae44bc5618cc254055b386a29576b4f87015',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0xb0ef657b8302bd2c74b6e6d9b2b4b39145b19c6f',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x3112c1613eac3dbae3d4e38cef023eb9e2c91cf7',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x88eb38ff79fba8c19943c0e5acfa67d5876adcc1',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x1430107a785c3a36a0c1fc0ee09b9631e2e72aff',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x041e679d04fc0d4f75eb937dea729df09a58e454',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0xad9d891134443b443d7f30013c7e14fe27f2e029',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0xe56df1e563de1b10715cb313d514af350d207212',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0xd7a3c8b975f71030135f1a66e9e23164d54ff455',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x6891cf116f9a3bdbd1e89413118ef81f69d298c3',
        chainId: 10,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0xbca056952d2a7a8dd4a002079219807cfdf9fd29',
        chainId: 10,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x2da9ae6f0c5e9ba561c1f92f265bbe80d753a538',
        chainId: 100,
        weight: '0',
        metadata: metaDefault,
      },
      {
        address: '0x6c65430515c70a3f5e62107cc301685b7d46f991',
        chainId: 100,
        weight: '70',
        metadata: metaDefault,
      },
      {
        address: '0xdda9cd214f12e7c2d58e871404a0a3b1177065c8',
        chainId: 100,
        weight: '180',
        metadata: metaDefault,
      },
      {
        address: '0x53a38655b4e659ef4c7f88a26fbf5c67932c7156',
        chainId: 100,
        weight: '180',
        metadata: metaDefault,
      },
      {
        address: '0x000000000000000000000000000000000000dead',
        chainId: 1,
        weight: '9430',
        metadata: metaRetainer,
      },
      {
        address: '0x22fa631064a99c43196ec5f8324b73211ced98f9',
        chainId: 100,
        weight: '70',
        metadata: metaDefault,
      },
      {
        address: '0xb93607d2173f847a18567809db51345d4ea38bad',
        chainId: 8453,
        weight: '70',
        metadata: metaDefault,
      },
    ];

    const result = getReorderedVotes(newAllocationsBig, userVotesBig, stakingContractsBig);
    expect(result).toEqual(expectedResult);
  });
});
