import { fireEvent, render, screen } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';

import LoginPage, { getServerSideProps as getLoginProps } from '../../../pages/web3auth/login';
import SwapOwnerPage, {
  getServerSideProps as getSwapOwnerProps,
} from '../../../pages/web3auth/swap-owner-session';

const mockProvider = jest.fn();
jest.mock('../../../context/Web3AuthProvider', () => ({
  Web3AuthProvider: ({ children }: { children: React.ReactNode }) => {
    mockProvider();
    return <div data-testid="web3auth-provider">{children}</div>;
  },
}));

jest.mock('@web3auth/modal', () => ({}));
let mockIsInitialized = false;
jest.mock('@web3auth/modal/react', () => ({
  useWeb3Auth: () => ({ isInitialized: mockIsInitialized, initError: null }),
  useWeb3AuthConnect: () => ({ connect: jest.fn(), isConnected: false }),
  useWeb3AuthDisconnect: () => ({ disconnect: jest.fn() }),
}));
jest.mock('@safe-global/protocol-kit', () => ({}));
jest.mock('../../../hooks/useReconnectWeb3Auth', () => ({ useReconnectWeb3Auth: () => jest.fn() }));
jest.mock('../../../utils', () => ({
  EvmChainDetails: {},
  EvmChainId: {},
  EvmChainName: {},
  toHexChainId: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
}));
jest.mock('next/router', () => ({ useRouter: () => ({ query: {} }) }));

const ctx = {} as GetServerSidePropsContext;

describe.each([
  {
    name: '/web3auth/login',
    Page: LoginPage,
    getServerSideProps: getLoginProps,
    message:
      'Setting up a backup wallet with Google or Apple is temporarily disabled. Close this window and enter a wallet address instead.',
    initEventId: 'WEB3AUTH_MODAL_INITIALIZED',
    closeEventId: 'WEB3AUTH_MODAL_CLOSED',
  },
  {
    name: '/web3auth/swap-owner-session',
    Page: SwapOwnerPage,
    getServerSideProps: getSwapOwnerProps,
    message:
      'Recovery with a Google or Apple backup wallet is temporarily disabled. Close this window and use your recovery phrase instead.',
    initEventId: 'WEB3AUTH_SWAP_OWNER_MODAL_INITIALIZED',
    closeEventId: 'WEB3AUTH_SWAP_OWNER_MODAL_CLOSED',
  },
])('$name', ({ Page, getServerSideProps, message, initEventId, closeEventId }) => {
  const originalEnv = process.env;
  let postMessage: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockIsInitialized = false;
    mockProvider.mockClear();
    postMessage = jest.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
  });

  afterEach(() => {
    postMessage.mockRestore();
    process.env = originalEnv;
  });

  it('reads the flag server-side', async () => {
    process.env.WEB3AUTH_ENABLED = 'true';
    expect(await getServerSideProps(ctx)).toEqual({ props: { web3AuthEnabled: true } });

    delete process.env.WEB3AUTH_ENABLED;
    expect(await getServerSideProps(ctx)).toEqual({ props: { web3AuthEnabled: false } });
  });

  describe('when disabled', () => {
    it('does not mount the Web3Auth provider', () => {
      render(<Page web3AuthEnabled={false} />);

      expect(mockProvider).not.toHaveBeenCalled();
      expect(screen.queryByTestId('web3auth-provider')).toBeNull();
    });

    it('posts its init event so Pearl drops the spinner', () => {
      render(<Page web3AuthEnabled={false} />);

      expect(postMessage).toHaveBeenCalledWith({ event_id: initEventId }, '*');
    });

    it('posts its close event from the Close button so Pearl closes the window', () => {
      render(<Page web3AuthEnabled={false} />);
      expect(postMessage).not.toHaveBeenCalledWith({ event_id: closeEventId }, '*');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(postMessage).toHaveBeenCalledWith({ event_id: closeEventId }, '*');
    });

    it('shows the temporarily disabled message', () => {
      render(<Page web3AuthEnabled={false} />);

      expect(screen.getByText(message)).toBeTruthy();
    });
  });

  describe('when enabled', () => {
    it('mounts the Web3Auth provider as before', () => {
      render(<Page web3AuthEnabled />);

      expect(mockProvider).toHaveBeenCalled();
      expect(screen.queryByText(message)).toBeNull();
    });

    it('posts the same init event Pearl listens for once Web3Auth initialises', () => {
      mockIsInitialized = true;
      render(<Page web3AuthEnabled />);

      expect(postMessage).toHaveBeenCalledWith({ event_id: initEventId }, '*');
      expect(postMessage).not.toHaveBeenCalledWith({ event_id: closeEventId }, '*');
    });
  });
});
