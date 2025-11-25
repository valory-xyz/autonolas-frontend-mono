type ValueOf<T> = T[keyof T];

export const EvmDisplayName = {
  Gnosis: 'Gnosis',
  Base: 'Base',
  Mode: 'Mode',
  Optimism: 'Optimism',
} as const;

export const EvmChainIdMap = {
  Gnosis: 100,
  Base: 8453,
  Mode: 34443,
  Optimism: 10,
} as const;
export type EvmChainId = (typeof EvmChainIdMap)[keyof typeof EvmChainIdMap];

export const EvmChainName = {
  [EvmChainIdMap.Gnosis]: EvmDisplayName.Gnosis,
  [EvmChainIdMap.Base]: EvmDisplayName.Base,
  [EvmChainIdMap.Mode]: EvmDisplayName.Mode,
  [EvmChainIdMap.Optimism]: EvmDisplayName.Optimism,
} as const;
export type EvmChainName = ValueOf<typeof EvmChainName>;

export const toHexChainId = (chainId: number | string): string => {
  return `0x${Number(chainId).toString(16)}`;
};
