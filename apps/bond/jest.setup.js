import { TextDecoder, TextEncoder } from 'util';

import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';

// jsdom does not expose TextEncoder/TextDecoder, which viem requires on import.
Object.assign(global, { TextDecoder, TextEncoder });

// jsdom does not implement matchMedia, and antd's responsive components call it on render.
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
