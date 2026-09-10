import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';

const { TextEncoder, TextDecoder } = require('util');

// jsdom omits both, and viem reaches for TextEncoder as soon as it is imported — which the store
// does, by way of wagmi — so anything importing the store throws without these.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// jsdom does not implement matchMedia, and antd's responsive components call it on render, so
// without this any test that renders one throws before reaching its assertions.
// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
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

// Must cover every chain `libs/util-constants/src/lib/rpcUrls.ts` reads. That module is pulled
// in transitively by `libs/util-constants`, and a missing export there fails at import time with
// "Cannot read properties of undefined (reading 'rpcUrls')" rather than anything about chains.
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
