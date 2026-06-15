import { readContract } from '@wagmi/core';

import {
  getBonds,
  getServiceAgentInstances,
  getAgentInstanceAndOperator,
} from '../../../components/ListServices/ServiceState/utils';

// viem's `readContract` returns multi-output reads as a POSITIONAL ARRAY
// (e.g. getAgentParams -> [numAgentIds, agentParams]), unlike the old web3.js
// reads which returned a named object (`response.agentParams`). These specs
// lock in that the utils read the array shape, guarding against the regression
// that broke the service-state section after the viem migration.
jest.mock('@wagmi/core', () => ({
  readContract: jest.fn(),
  simulateContract: jest.fn(),
  writeContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
}));

jest.mock('../../../common-util/functions', () => ({
  requireChainId: () => 1,
}));

jest.mock('../../../common-util/Login/config', () => ({
  wagmiConfig: {},
}));

// Sever the transitive import chain (helpers/functions -> ListCommon -> hooks
// -> `wagmi`), whose ESM hooks package isn't transformed by jest. The functions
// under test don't use convertStringToArray; a stub keeps helpers/functions
// loadable without pulling in the wagmi React hooks.
jest.mock('../../../common-util/List/ListCommon', () => ({
  convertStringToArray: (str) =>
    typeof str === 'string' ? str.split(',').map((s) => s.trim()) : [],
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ServiceState/utils – viem multi-output array shape', () => {
  it('getBonds reads the [numAgentIds, agentParams] array', async () => {
    readContract.mockResolvedValueOnce([
      2n,
      [
        { slots: 2, bond: 2000n },
        { slots: 3, bond: 4000n },
      ],
    ]);

    const { slots, bonds } = await getBonds('1');

    expect(slots).toEqual([2, 3]);
    expect(bonds).toEqual([2000n, 4000n]);
  });

  it('getBonds does not throw when agentParams is empty', async () => {
    readContract.mockResolvedValueOnce([0n, []]);

    const { slots, bonds } = await getBonds('1');

    expect(slots).toEqual([]);
    expect(bonds).toEqual([]);
  });

  it('getServiceAgentInstances reads the [num, agentInstances] array', async () => {
    const instances = ['0xabc', '0xdef'];
    readContract.mockResolvedValueOnce([2n, instances]);

    const result = await getServiceAgentInstances('1');

    expect(result).toEqual(instances);
  });

  it('getAgentInstanceAndOperator pairs each instance with its operator', async () => {
    const instances = ['0xinstance1', '0xinstance2'];
    readContract
      // getAgentInstances -> [numAgentInstances, agentInstances]
      .mockResolvedValueOnce([2n, instances])
      // mapAgentInstanceOperators(instance) -> operator address
      .mockResolvedValueOnce('0xoperator1')
      .mockResolvedValueOnce('0xoperator2');

    const result = await getAgentInstanceAndOperator('1');

    expect(result).toEqual([
      { id: 'agent-instance-row-1', operatorAddress: '0xoperator1', agentInstance: '0xinstance1' },
      { id: 'agent-instance-row-2', operatorAddress: '0xoperator2', agentInstance: '0xinstance2' },
    ]);
  });
});
