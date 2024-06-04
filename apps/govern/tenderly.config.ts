import { defineChain } from 'viem'

export const virtualMainnet = defineChain({
  id: 1,
  name: 'Virtual Mainnet',
  nativeCurrency: { name: 'vETH', symbol: 'vETH', decimals: 18 },
  rpcUrls: {
    default: { http: [`${process.env.NEXT_PUBLIC_MAINNET_TEST_RPC}`] }
  },
  blockExplorers: {
    default: {
      name: 'Tenderly Explorer',
      url: ''
    }
  },
})