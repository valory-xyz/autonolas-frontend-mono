import { defineChain } from 'viem';

export const virtualMainnet = defineChain({
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'vETH', symbol: 'vETH', decimals: 18 },
  rpcUrls: {
    default: { http: [`${process.env.NEXT_PUBLIC_MAINNET_TEST_RPC}`] },
  },
  blockExplorers: {
    default: {
      name: 'Tenderly Explorer',
      url: '',
    },
  },
});

export const virtualGnosis = defineChain({
  id: 100,
  name: 'Gnosis',
  nativeCurrency: { name: 'vXDAI', symbol: 'vXDAI', decimals: 18 },
  rpcUrls: {
    default: { http: [`${process.env.NEXT_PUBLIC_GNOSIS_TEST_RPC}`] },
  },
  blockExplorers: {
    default: {
      name: 'Tenderly Explorer',
      url: '',
    },
  },
});

export const virtualPolygon = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'vMATIC', symbol: 'vMATIC', decimals: 18 },
  rpcUrls: {
    default: { http: [`${process.env.NEXT_PUBLIC_POLYGON_TEST_RPC}`] },
  },
  blockExplorers: {
    default: {
      name: 'Tenderly Explorer',
      url: '',
    },
  },
});
