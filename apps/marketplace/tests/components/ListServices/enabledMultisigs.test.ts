import { readContracts } from '@wagmi/core';

import { multisigCandidates } from '../../../common-util/Contracts/addresses';
import { getEnabledMultisigs } from '../../../components/ListServices/utils';

jest.mock('@wagmi/core', () => ({
  readContract: jest.fn(),
  readContracts: jest.fn(),
}));
jest.mock('common-util/Login/config', () => ({ wagmiConfig: {} }));
jest.mock('common-util/subgraphs', () => ({ getServicesFromSubgraph: jest.fn() }));
jest.mock('common-util/List/ListCommon', () => ({ convertStringToArray: jest.fn() }));

const mockReadContracts = readContracts as jest.Mock;
const GNOSIS = 100;

const GNOSIS_SERVICE_REGISTRY_L2 = '0x9338b5153AE39BB89f50468E608eD9d764B755fD';

describe('getEnabledMultisigs', () => {
  const originalCandidates = multisigCandidates[GNOSIS];

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('keeps only the candidates ServiceRegistry.mapMultisigs enables', async () => {
    const [current] = originalCandidates;
    const other = '0x00000000000000000000000000000000000000b2';
    jest.replaceProperty(multisigCandidates, GNOSIS, [current, other]);
    mockReadContracts.mockResolvedValue([false, true]);

    await expect(getEnabledMultisigs(GNOSIS)).resolves.toEqual([other]);

    const { allowFailure, contracts } = mockReadContracts.mock.calls[0][1];
    // With allowFailure, wagmi returns { status, result } objects and nothing would ever match.
    expect(allowFailure).toBe(false);
    expect(
      contracts.map(
        ({
          address,
          chainId,
          functionName,
          args,
        }: {
          address: string;
          chainId: number;
          functionName: string;
          args: unknown[];
        }) => [address, chainId, functionName, args],
      ),
    ).toEqual([
      [GNOSIS_SERVICE_REGISTRY_L2, GNOSIS, 'mapMultisigs', [current]],
      [GNOSIS_SERVICE_REGISTRY_L2, GNOSIS, 'mapMultisigs', [other]],
    ]);
  });

  it('refuses a chain with no candidates configured, without reading the registry', async () => {
    await expect(getEnabledMultisigs(999999)).rejects.toThrow(
      'No Safe creation wrapper is configured for chain 999999',
    );
    expect(mockReadContracts).not.toHaveBeenCalled();
  });

  it('offers nothing when every candidate is disabled', async () => {
    mockReadContracts.mockResolvedValue(originalCandidates.map(() => false));

    await expect(getEnabledMultisigs(GNOSIS)).resolves.toEqual([]);
  });

  it('propagates a failed read rather than offering every candidate', async () => {
    mockReadContracts.mockRejectedValue(new Error('rpc down'));

    await expect(getEnabledMultisigs(GNOSIS)).rejects.toThrow('rpc down');
  });
});
