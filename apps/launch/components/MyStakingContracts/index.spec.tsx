import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAccount } from 'wagmi';

import { useMyStakingContracts, useRetryMyStakingContracts } from 'hooks/useMyStakingContracts';

import { MyStakingContracts } from './index';

jest.mock('wagmi', () => ({ useAccount: jest.fn() }));
jest.mock('libs/util-constants/src', () => ({
  CHAIN_NAMES: { 4663: 'Robinhood Chain' },
  GOVERN_URL: 'https://govern.test',
  UNICODE_SYMBOLS: { EXTERNAL_LINK: '↗' },
}));
jest.mock('store/index', () => ({
  useAppSelector: jest.fn((selector) =>
    selector({ network: { networkId: 4663, networkName: 'robinhood-chain' } }),
  ),
}));
jest.mock('hooks/useMyStakingContracts', () => ({
  useMyStakingContracts: jest.fn(),
  useRetryMyStakingContracts: jest.fn(),
}));
jest.mock('../Login', () => ({ LoginV2: () => null }));
jest.mock('./List', () => ({ List: () => <div data-testid="contracts-list" /> }));

const retry = jest.fn();

const showList = (state: {
  myStakingContracts?: unknown[];
  isMyStakingContractsLookupFailed?: boolean;
}) => {
  (useMyStakingContracts as jest.Mock).mockReturnValue({
    isMyStakingContractsLoading: false,
    myStakingContracts: [],
    isMyStakingContractsLookupFailed: false,
    ...state,
  });
  render(<MyStakingContracts />);
};

describe('<MyStakingContracts/>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useRetryMyStakingContracts as jest.Mock).mockReturnValue({ retry, isRetrying: false });
  });

  it('offers a retry, not "no contracts yet", when the lookup failed', () => {
    showList({ isMyStakingContractsLookupFailed: true });

    expect(screen.getByTestId('my-staking-contracts-lookup-failed')).toBeInTheDocument();
    expect(screen.queryByText(/haven’t created any staking contracts/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('contracts-list')).not.toBeInTheDocument();

    screen.getByRole('button', { name: /retry/i }).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('still lists contracts created this session when the lookup failed', () => {
    showList({ isMyStakingContractsLookupFailed: true, myStakingContracts: [{ id: '0x1' }] });

    expect(screen.getByTestId('my-staking-contracts-lookup-failed')).toBeInTheDocument();
    expect(screen.getByTestId('contracts-list')).toBeInTheDocument();
  });

  it('shows "no contracts yet" only after a successful lookup found none', () => {
    showList({});

    expect(screen.getByText(/haven’t created any staking contracts/)).toBeInTheDocument();
    expect(screen.queryByTestId('my-staking-contracts-lookup-failed')).not.toBeInTheDocument();
  });
});
