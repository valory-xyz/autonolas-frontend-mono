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


jest.mock('wagmi/chains', () => ({
  gnosis: {
    chainId: 1,
    name: 'Gnosis',
    symbol: 'GNO',
    rpc: 'https://rpc.gnosis.io',
    explorer: 'https://explorer.gnosis.io',
    chain: 'gnosis',
    rpcUrls: {
      default: {
        http: ['https://rpc.gnosischain.com'],
        webSocket: ['wss://rpc.gnosischain.com/wss'],
      },
    },
  },

  mainnet: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpc: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorer: 'https://etherscan.io',
    chain: 'mainnet',
    rpcUrls: {
      default: {
        http: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        webSocket: ['wss://mainnet.infura.io/ws/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
      },
    },
  },

  polygon: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpc: 'https://rpc-mainnet.maticvigil.com',
    explorer: 'https://polygonscan.com',
    chain: 'polygon',
    rpcUrls: {
      default: {
        http: ['https://rpc-mainnet.maticvigil.com'],
        webSocket: ['wss://rpc-mainnet.maticvigil.com'],
      },
    },
  }
}));