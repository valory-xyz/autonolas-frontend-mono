import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { request } from 'graphql-request';
import { ReactNode } from 'react';

import { useStakingDetails } from './staking';

jest.mock('graphql-request', () => ({
  gql: (strings: TemplateStringsArray) => strings.join(''),
  request: jest.fn(),
}));
jest.mock('wagmi', () => ({
  useReadContract: () => ({ data: undefined, isLoading: false }),
}));
jest.mock('common-util/AbiAndAddresses', () => ({}));
jest.mock('common-util/functions', () => ({
  formatToEth: (wei: string) => String(Number(wei) / 1e18),
}));
jest.mock('util/constants', () => ({
  SERVICE_STAKING_STATE: ['Unstaked', 'Staked', 'Evicted'],
  STAKING_CONTRACTS_BASE_SQUID_URL: 'https://squid.test/staking-base/graphql',
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useStakingDetails', () => {
  it('reads checkpoints from the squid, tie-breaking epochs on id', async () => {
    (request as jest.Mock).mockResolvedValue({
      checkpoints: [
        { serviceIds: ['1', '2'], rewards: ['1000000000000000000', '5'] },
        { serviceIds: ['2'], rewards: ['7'] },
        { serviceIds: ['1'], rewards: ['2000000000000000000'] },
      ],
    });

    const { result } = renderHook(() => useStakingDetails('1', undefined), { wrapper });

    await waitFor(() => expect(Number(result.current.data.totalRewards)).toBe(3));
    const [url, query] = (request as jest.Mock).mock.calls[0];
    expect(url).toBe('https://squid.test/staking-base/graphql');
    expect(query).toContain('checkpoints(orderBy: [epoch_DESC, id_DESC], limit: 1000)');
  });
});
