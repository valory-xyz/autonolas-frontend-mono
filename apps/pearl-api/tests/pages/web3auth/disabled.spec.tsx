import { render, screen } from '@testing-library/react';
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
jest.mock('@web3auth/modal/react', () => ({
  useWeb3Auth: () => ({ isInitialized: false, initError: null }),
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
  },
  {
    name: '/web3auth/swap-owner-session',
    Page: SwapOwnerPage,
    getServerSideProps: getSwapOwnerProps,
    message:
      'Recovery with a Google or Apple backup wallet is temporarily disabled. Close this window and use your recovery phrase instead.',
    initEventId: 'WEB3AUTH_SWAP_OWNER_MODAL_INITIALIZED',
  },
])('$name', ({ Page, getServerSideProps, message, initEventId }) => {
  const original = process.env.WEB3AUTH_ENABLED;
  let postMessage: jest.SpyInstance;

  beforeEach(() => {
    mockProvider.mockClear();
    postMessage = jest.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
  });

  afterEach(() => {
    postMessage.mockRestore();
    if (original === undefined) delete process.env.WEB3AUTH_ENABLED;
    else process.env.WEB3AUTH_ENABLED = original;
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
  });
});
