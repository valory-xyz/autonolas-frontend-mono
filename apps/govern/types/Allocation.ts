import { Address } from 'viem';

import { Metadata } from './Contract';

export type Allocation = { address: Address; chainId: number; metadata: Metadata; weight: number };
