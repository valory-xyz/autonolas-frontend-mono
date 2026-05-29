import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder;
// viem (via ox/core/Bytes) needs TextDecoder which jsdom doesn't provide.
global.TextDecoder = TextDecoder;

// import jest from 'jest';

/*-------------------- mock window.matchMedia ---------------------*/

// https:// jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/*-------------------- 3rd party library mocks ---------------------*/

jest.mock('ipfs-only-hash', () => ({
  of: jest.fn(),
}));

jest.mock('next/router', () => jest.requireActual('next-router-mock'));

jest.mock('@solana/wallet-adapter-react', () => ({
  useAnchorWallet: jest.fn(),
  useConnection: () => ({ connection: 'connection' }),
}));

/*-------------------- common-util mocks ---------------------*/
jest.mock('./common-util/Login', () => ({
  SUPPORTED_CHAINS: [{ id: 1 }],
}));

jest.mock('./common-util/Login/config', () => ({
  EVM_SUPPORTED_CHAINS: [{ id: 1 }],
  SVM_SUPPORTED_CHAINS: [{ id: 1 }],
  SUPPORTED_CHAINS: [{ id: 1 }],
  // wagmiConfig is stubbed as an empty object only because no current spec
  // exercises a real wagmi read/write path — the migrated specs that do mock
  // the contract layer one level up (`.skip` with TODO(viem-migration), see
  // tests/components/List*). When adding a NEW spec that touches a migrated
  // function, mock @wagmi/core's readContract / simulateContract /
  // writeContract / waitForTransactionReceipt directly instead of relying on
  // this empty stub — passing `{}` into the real wagmi-core actions throws
  // opaque "Invalid wagmi config" errors deep in the stack.
  wagmiConfig: {},
}));

const { mainnet, optimism, gnosis, polygon, base, arbitrum, celo, mode } = require('viem/chains');

jest.mock('wagmi/chains', () => ({
  mainnet,
  optimism,
  gnosis,
  polygon,
  base,
  arbitrum,
  celo,
  mode,
}));
