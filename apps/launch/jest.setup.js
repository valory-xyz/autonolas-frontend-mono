import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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

const { mainnet, optimism, gnosis, polygon, base, arbitrum, celo } = require('viem/chains');

jest.mock('wagmi/chains', () => ({
  mainnet,
  optimism,
  gnosis,
  polygon,
  base,
  arbitrum,
  celo,
}));

jest.mock('common-util/config/wagmi', () => ({
  SUPPORTED_CHAINS: [{ name: 'ethereum', chainId: 1 }],
}));
