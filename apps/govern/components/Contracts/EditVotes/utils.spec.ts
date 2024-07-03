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
  },
  '0x3': {
    current: { slope: 1, power: 500, end: 500 },
    next: { slope: 1, power: 500, end: 500 },
  },
  '0x5': {
    current: { slope: 1, power: 1000, end: 1000 },
    next: { slope: 1, power: 1000, end: 1000 },
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
  it('should reorder votes correctly', () => {
    const result = getReorderedVotes(allocations, userVotes, stakingContracts);
    expect(result).toEqual([
      { address: '0x3', chainId: 1, weight: '0' },
      { address: '0x2', chainId: 1, weight: '1000' },
      { address: '0x5', chainId: 1, weight: '6000' },
      { address: '0x1', chainId: 1, weight: '3000' },
    ]);
  });

  it('should handle empty allocations', () => {
    const result = getReorderedVotes([], userVotes, stakingContracts);
    expect(result).toEqual([
      { address: '0x2', chainId: 1, weight: '0' },
      { address: '0x5', chainId: 1, weight: '0' },
      { address: '0x3', chainId: 1, weight: '0' },
    ]);
  });

  it('should handle empty userVotes', () => {
    const result = getReorderedVotes(allocations, {}, stakingContracts);
    expect(result).toEqual([
      { address: '0x2', chainId: 1, weight: '1000' },
      { address: '0x1', chainId: 1, weight: '3000' },
      { address: '0x5', chainId: 1, weight: '6000' },
    ]);
  });

  it('should handle empty stakingContracts', () => {
    const result = getReorderedVotes(allocations, userVotes, []);
    expect(result).toEqual([
      { address: '0x2', chainId: 1, weight: '1000' },
      { address: '0x5', chainId: 1, weight: '6000' },
      { address: '0x1', chainId: 1, weight: '3000' },
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
      { address: '0x2', chainId: 1, weight: '0' },
      { address: '0x5', chainId: 1, weight: '0' },
      { address: '0x3', chainId: 1, weight: '0' },
      { address: '0x4', chainId: 1, weight: '2000' },
    ]);
  });
});
