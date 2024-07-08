import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAccount } from 'wagmi';

import { useAppSelector } from 'store/index';

import { NominateContract } from './index';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useSwitchChain: jest.fn().mockReturnValue({
    switchChainAsync: jest.fn(),
  }),
}));
jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ id: '0x12345' }),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    router: {
      replace: jest.fn(),
    },
  }),
}));
jest.mock('libs/util-constants/src', () => ({
  EXPLORER_URLS: {
    1: 'https://etherscan.io',
  },
  RPC_URLS: {
    1: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
  },
}));

jest.mock('common-util/config/wagmi', () => ({
  SUPPORTED_CHAINS: [{ name: 'ethereum', chainId: 1 }],
}));
jest.mock('store/index', () => ({
  useAppDispatch: jest.fn().mockReturnValue(jest.fn()),
  useAppSelector: jest.fn(),
}));
jest.mock('../Login', () => ({ LoginV2: 'ConnectWallet' }));

describe('<NominateContract/>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contract not found', () => {
    beforeEach(() => {
      (useAccount as jest.Mock).mockReturnValue({
        address: '0x12345',
      });
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

    it('should show error message if contract is not found', () => {
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

  describe('Account not connected', () => {
    it('should show connect wallet message if account is not connected', () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: '',
      });

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
  });

  describe('Contract already nominated', () => {
    it('should show contract already nominated message if contract is already nominated', () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: '0x12345',
      });

      (useAppSelector as jest.Mock).mockReturnValue({
        networkDisplayName: 'Ethereum',
        networkName: 'ethereum',
        myStakingContracts: [
          {
            id: '0x12345',
            name: 'My Staking Contract',
            isNominated: true,
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
  });

  describe('Waiting for user to nominate contract', () => {
    it('should wait for nominating', async () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: '0xMyAddress',
      });

      (useAppSelector as jest.Mock).mockReturnValue({
        networkDisplayName: 'Ethereum',
        networkName: 'ethereum',
        myStakingContracts: [
          {
            id: '0x12345',
            name: 'My Staking Contract',
            isNominated: false,
          },
        ],
      });

      render(<NominateContract />);

      expect(screen.getByText(/Nominating staking contract.../)).toBeInTheDocument();
      expect(screen.getByText(/Waiting for transaction.../)).toBeInTheDocument();
    });
  });
});
