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

describe('getEnabledMultisigs', () => {
  const originalCandidates = multisigCandidates[GNOSIS];

  afterEach(() => {
    multisigCandidates[GNOSIS] = originalCandidates;
    jest.resetAllMocks();
  });

  it('keeps only the candidates ServiceRegistry.mapMultisigs enables', async () => {
    const [current] = originalCandidates;
    const other = '0x00000000000000000000000000000000000000b2';
    multisigCandidates[GNOSIS] = [current, other];
    mockReadContracts.mockResolvedValue([false, true]);

    await expect(getEnabledMultisigs(GNOSIS)).resolves.toEqual([other]);

    const { contracts } = mockReadContracts.mock.calls[0][1];
    expect(
      contracts.map(({ functionName, args }: { functionName: string; args: unknown[] }) => [
        functionName,
        args,
      ]),
    ).toEqual([
      ['mapMultisigs', [current]],
      ['mapMultisigs', [other]],
    ]);
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
