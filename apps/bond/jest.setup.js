import { TextDecoder, TextEncoder } from 'util';

import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';

// jsdom does not expose TextEncoder/TextDecoder, which viem requires on import.
Object.assign(global, { TextDecoder, TextEncoder });
