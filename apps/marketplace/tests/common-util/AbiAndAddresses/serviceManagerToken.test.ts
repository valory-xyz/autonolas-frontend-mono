import { encodeFunctionData, parseAbi } from 'viem';

import { SERVICE_MANAGER_TOKEN_CONTRACT } from '../../../common-util/AbiAndAddresses';

// The direct calls the Marketplace sends, as encoded before ServiceManager 1.3.0
const PRE_1_3_0_ABI = parseAbi([
  'function registerAgents(uint256 serviceId, address[] agentInstances, uint32[] agentIds) payable returns (bool)',
  'function unbond(uint256 serviceId) returns (bool, uint256)',
]);

describe('ServiceManager 1.3.0 ABI', () => {
  it('encodes registerAgents as before', () => {
    const args = [
      BigInt(7),
      ['0x00000000000000000000000000000000000000a1', '0x00000000000000000000000000000000000000a2'],
      [1, 2],
    ] as const;

    expect(
      encodeFunctionData({
        abi: SERVICE_MANAGER_TOKEN_CONTRACT.abi,
        functionName: 'registerAgents',
        args,
      }),
    ).toBe(encodeFunctionData({ abi: PRE_1_3_0_ABI, functionName: 'registerAgents', args }));
  });

  it('encodes unbond as before', () => {
    expect(
      encodeFunctionData({
        abi: SERVICE_MANAGER_TOKEN_CONTRACT.abi,
        functionName: 'unbond',
        args: [BigInt(7)],
      }),
    ).toBe(encodeFunctionData({ abi: PRE_1_3_0_ABI, functionName: 'unbond', args: [BigInt(7)] }));
  });
});
