type ValueOf<T> = T[keyof T];

export const EvmChainIdMap = {
  Gnosis: 100,
  Base: 8453,
  Mode: 34443,
  Optimism: 10,
} as const;
export type EvmChainId = (typeof EvmChainIdMap)[keyof typeof EvmChainIdMap];

export const EvmChainName = {
  [EvmChainIdMap.Gnosis]: 'Gnosis',
  [EvmChainIdMap.Base]: 'Base',
  [EvmChainIdMap.Mode]: 'Mode',
  [EvmChainIdMap.Optimism]: 'Optimism',
} as const;
export type EvmChainName = ValueOf<typeof EvmChainName>;
