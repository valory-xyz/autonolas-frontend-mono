import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { addNominee } from 'common-util/functions/web3';
import { useAppDispatch, useAppSelector } from 'store/index';
import { recordConfirmedNomination } from 'store/launch';

import { NominateContract } from './index';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useSwitchChain: jest.fn().mockReturnValue({ switchChainAsync: jest.fn() }),
}));
jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ id: '0x12345' }),
}));
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    replace: jest.fn(),
  }),
}));

jest.mock('libs/util-constants/src', () => ({
  EXPLORER_URLS: { 1: 'https://etherscan.io' },
  RPC_URLS: { 1: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key' },
}));

jest.mock('store/index', () => ({
  useAppDispatch: jest.fn().mockReturnValue(jest.fn()),
  useAppSelector: jest.fn(),
}));
// Stops Jest from following the import chain into @wagmi/core, which ships ESM-only
// and isn't covered by the default transformIgnorePatterns.
jest.mock('common-util/functions/web3', () => ({
  addNominee: jest.fn(),
}));
jest.mock('../Login', () => ({ LoginV2: 'ConnectWallet' }));
// The owned-list check is covered in hooks/useGetMyStakingContracts.spec.ts; here the list comes
// from the same mocked selector state as before.
jest.mock('hooks/useMyStakingContracts', () => ({
  useMyStakingContracts: () => {
    const { useAppSelector: selector } = jest.requireMock('store/index');
    const { isMyStakingContractsLoading = false, myStakingContracts = [] } = selector();
    return { isMyStakingContractsLoading, myStakingContracts };
  },
}));
const mockRefetchNominees = jest.fn();
jest.mock('hooks/useNominees', () => ({
  useNominees: () => ({ refetch: mockRefetchNominees, isFetching: false }),
}));

describe('<NominateContract/>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contract not found', () => {
    beforeEach(() => {
      (useAccount as jest.Mock).mockReturnValue({ address: '0x12345' });
    });

    it('should show loader when fetching contract', () => {
      (useAppSelector as jest.Mock).mockReturnValue({
        networkDisplayName: 'Ethereum',
        isMyStakingContractsLoading: true,
        myStakingContracts: [],
      });

      render(<NominateContract />);

      expect(screen.getByTestId('nominate-contract-loader')).toBeInTheDocument();
    });

    it('should show error message if staking contract list is empty', () => {
      (useAppSelector as jest.Mock).mockReturnValue({
        networkDisplayName: 'Ethereum',
        isMyStakingContractsLoading: false,
        myStakingContracts: [],
      });

      render(<NominateContract />);

      expect(screen.getByText(/Contract not found.../)).toBeInTheDocument();
      expect(
        screen.getByText(
          'We couldn’t find the staking contract you’re referring to. Go to your staking contracts and try again.',
        ),
      ).toBeInTheDocument();
    });

    it('should show error message if invalid contract is requested', () => {
      (useAppSelector as jest.Mock).mockReturnValue({
        networkDisplayName: 'Ethereum',
        myStakingContracts: [{ id: '0xRandomAddress' }],
      });

      render(<NominateContract />);

      expect(screen.getByText(/Contract not found.../)).toBeInTheDocument();
      expect(
        screen.getByText(
          'We couldn’t find the staking contract you’re referring to. Go to your staking contracts and try again.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should show connect wallet message if account is not connected', () => {
    (useAccount as jest.Mock).mockReturnValue({ address: '' });

    (useAppSelector as jest.Mock).mockReturnValue({
      networkDisplayName: 'Ethereum',
      myStakingContracts: [{ id: '0x12345' }],
    });

    render(<NominateContract />);

    expect(screen.getByText(/Connect your wallet to nominate.../)).toBeInTheDocument();
    expect(
      screen.getByText(/Connect the wallet to nominate the staking contract./),
    ).toBeInTheDocument();
  });

  it('should show contract already nominated message if contract is already nominated', () => {
    (useAccount as jest.Mock).mockReturnValue({ address: '0x12345' });

    (useAppSelector as jest.Mock).mockReturnValue({
      networkDisplayName: 'Ethereum',
      networkName: 'ethereum',
      myStakingContracts: [
        {
          id: '0x12345',
          name: 'My Staking Contract',
          nominationStatus: 'nominated',
        },
      ],
    });

    render(<NominateContract />);

    expect(screen.getByText(/Contract has already been nominated/)).toBeInTheDocument();
    expect(
      screen.getByText('The contract has already been nominated. You can close this page now.'),
    ).toBeInTheDocument();

    const viewMyStakingContractsButton = screen.getByText(/View my staking contracts/);
    if (!viewMyStakingContractsButton)
      throw new Error('View my staking contracts button not found');
    expect(viewMyStakingContractsButton.closest('a')).toHaveAttribute(
      'href',
      '/ethereum/my-staking-contracts',
    );
  });

  it('should wait for nominating', async () => {
    (useAccount as jest.Mock).mockReturnValue({ address: '0xMyAddress' });

    (useAppSelector as jest.Mock).mockReturnValue({
      networkDisplayName: 'Ethereum',
      networkName: 'ethereum',
      myStakingContracts: [
        {
          id: '0x12345',
          name: 'My Staking Contract',
          nominationStatus: 'notNominated',
        },
      ],
    });

    render(<NominateContract />);

    expect(screen.getByText(/Nominating staking contract.../)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for transaction.../)).toBeInTheDocument();
  });

  // Regression tests for the runaway-transactions bug: background data refreshes
  // recreate the nominate/switch callbacks, re-running the trigger effect. Without
  // the ref guards (and the per-contract `key`), this fired a fresh transaction on
  // every re-render — flooding the wallet with hundreds of signatures.
  describe('auto-trigger guards', () => {
    const oneContractOnMainnet = () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: '0xMyAddress',
        chainId: mainnet.id,
      });
      // A fresh array/object on every render mimics Redux re-dispatching a new
      // myStakingContracts reference from background wagmi refetches.
      (useAppSelector as jest.Mock).mockImplementation(() => ({
        networkDisplayName: 'Ethereum',
        networkName: 'ethereum',
        myStakingContracts: [
          {
            id: '0x12345',
            name: 'My Staking Contract',
            nominationStatus: 'notNominated',
          },
        ],
      }));
    };

    it('should call addNominee only once despite repeated re-renders', async () => {
      oneContractOnMainnet();

      const { rerender } = render(<NominateContract />);

      // Force re-renders, each producing a new contractInfo identity.
      for (let i = 0; i < 5; i += 1) {
        rerender(<NominateContract />);
      }

      await waitFor(() => expect(addNominee).toHaveBeenCalledTimes(1));
    });

    it('should attempt the network switch only once when on the wrong chain', async () => {
      const switchChainAsync = jest.fn().mockResolvedValue(undefined);
      (useSwitchChain as jest.Mock).mockReturnValue({ switchChainAsync });
      // Gnosis (100), i.e. not mainnet.
      (useAccount as jest.Mock).mockReturnValue({
        address: '0xMyAddress',
        chainId: 100,
      });
      (useAppSelector as jest.Mock).mockImplementation(() => ({
        networkDisplayName: 'Gnosis',
        networkName: 'gnosis',
        myStakingContracts: [
          {
            id: '0x12345',
            name: 'My Staking Contract',
            nominationStatus: 'notNominated',
          },
        ],
      }));

      const { rerender } = render(<NominateContract />);
      for (let i = 0; i < 5; i += 1) {
        rerender(<NominateContract />);
      }

      await waitFor(() => expect(switchChainAsync).toHaveBeenCalledTimes(1));
      // Still on the wrong chain, so the nominate transaction must not fire.
      expect(addNominee).not.toHaveBeenCalled();
    });

    it('should nominate again when navigating to a different contract', async () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: '0xMyAddress',
        chainId: mainnet.id,
      });
      (useAppSelector as jest.Mock).mockImplementation(() => ({
        networkDisplayName: 'Ethereum',
        networkName: 'ethereum',
        myStakingContracts: [
          {
            id: '0x11111',
            name: 'Contract A',
            nominationStatus: 'notNominated',
          },
          {
            id: '0x22222',
            name: 'Contract B',
            nominationStatus: 'notNominated',
          },
        ],
      }));

      let currentId = '0x11111';
      (useParams as jest.Mock).mockImplementation(() => ({ id: currentId }));

      const { rerender } = render(<NominateContract />);
      await waitFor(() => expect(addNominee).toHaveBeenCalledTimes(1));
      expect(addNominee).toHaveBeenLastCalledWith(expect.objectContaining({ address: '0x11111' }));

      // Switch to another contract on the same route — the `key` remounts the
      // inner component, resetting the guard so the new contract is nominated.
      currentId = '0x22222';
      rerender(<NominateContract />);

      await waitFor(() => expect(addNominee).toHaveBeenCalledTimes(2));
      expect(addNominee).toHaveBeenLastCalledWith(expect.objectContaining({ address: '0x22222' }));
    });
  });

  describe('nomination status', () => {
    beforeEach(() => {
      // The guard tests above leave useParams pointing at another contract.
      (useParams as jest.Mock).mockReturnValue({ id: '0x12345' });
      (addNominee as jest.Mock).mockReset();
      mockRefetchNominees.mockClear();
      (useAppDispatch() as jest.Mock).mockReset();
    });

    const contractWithStatus = (nominationStatus: string) => {
      (useAccount as jest.Mock).mockReturnValue({
        address: '0xMyAddress',
        chainId: mainnet.id,
      });
      (useAppSelector as jest.Mock).mockReturnValue({
        networkDisplayName: 'Robinhood Chain',
        networkName: 'robinhood-chain',
        myStakingContracts: [
          {
            id: '0x12345',
            chainId: 4663,
            name: 'My Staking Contract',
            nominationStatus,
          },
        ],
      });
    };

    it('sends no transaction and offers a retry when the status is unknown', async () => {
      contractWithStatus('unknown');

      render(<NominateContract />);

      expect(screen.getByText(/Couldn’t check the nomination status/)).toBeInTheDocument();
      screen.getByTestId('nomination-status-retry').click();
      expect(mockRefetchNominees).toHaveBeenCalled();
      expect(addNominee).not.toHaveBeenCalled();
    });

    it('sends no transaction while the status is loading', () => {
      contractWithStatus('loading');

      render(<NominateContract />);

      expect(screen.getByTestId('nominate-contract-loader')).toBeInTheDocument();
      expect(addNominee).not.toHaveBeenCalled();
    });

    it('records the confirmed nomination and refreshes nominees after a successful receipt', async () => {
      contractWithStatus('notNominated');
      (addNominee as jest.Mock).mockResolvedValue({ status: 'success' });

      render(<NominateContract />);

      await waitFor(() => expect(addNominee).toHaveBeenCalledTimes(1));
      await waitFor(
        () =>
          expect(useAppDispatch()).toHaveBeenCalledWith(
            recordConfirmedNomination({ chainId: 4663, address: '0x12345' }),
          ),
        { timeout: 3000 },
      );
      expect(mockRefetchNominees).toHaveBeenCalled();
      await waitFor(
        () =>
          expect(useRouter().replace).toHaveBeenCalledWith('/robinhood-chain/my-staking-contracts'),
        { timeout: 3000 },
      );
    });

    it('records the nomination at once and keeps the success view while it reads as nominated', async () => {
      contractWithStatus('notNominated');
      (addNominee as jest.Mock).mockResolvedValue({ status: 'success' });
      // The store as the app has it: recording makes the contract read as nominated.
      (useAppDispatch() as jest.Mock).mockImplementation((action: { type: string }) => {
        if (action.type === recordConfirmedNomination.type) contractWithStatus('nominated');
      });

      const { rerender } = render(<NominateContract />);

      await waitFor(() =>
        expect(useAppDispatch()).toHaveBeenCalledWith(
          recordConfirmedNomination({ chainId: 4663, address: '0x12345' }),
        ),
      );
      // Recorded and refreshed before the 2s success delay ends.
      expect(mockRefetchNominees).toHaveBeenCalled();
      expect(useRouter().replace).not.toHaveBeenCalled();

      rerender(<NominateContract />);
      expect(screen.getByText(/Transaction successful/)).toBeInTheDocument();
      expect(screen.queryByText(/already nominated/i)).not.toBeInTheDocument();
      expect(addNominee).toHaveBeenCalledTimes(1);

      await waitFor(
        () =>
          expect(useRouter().replace).toHaveBeenCalledWith('/robinhood-chain/my-staking-contracts'),
        { timeout: 3000 },
      );
    });

    it('records nothing when the nomination fails', async () => {
      contractWithStatus('notNominated');
      (addNominee as jest.Mock).mockRejectedValue(new Error('Nomination transaction reverted'));

      render(<NominateContract />);

      await waitFor(() => expect(addNominee).toHaveBeenCalledTimes(1));
      await new Promise((resolve) => setTimeout(resolve, 2200));
      expect(useAppDispatch()).not.toHaveBeenCalled();
      expect(mockRefetchNominees).not.toHaveBeenCalled();
    });
  });
});
