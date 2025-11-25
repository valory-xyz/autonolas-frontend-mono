import { base, gnosis, mode, optimism } from 'viem/chains';

type ValueOf<T> = T[keyof T];

export const EvmChainDetails: Record<
  EvmChainId,
  {
    displayName: string;
    logo: string;
    explorer?: string;
  }
> = {
  '100': {
    displayName: 'Gnosis',
    logo: 'https://gnosisscan.io/assets/xdai/images/svg/logos/token-secondary-dim.svg',
    explorer: gnosis.blockExplorers?.default?.url || '',
  },
  '8453': {
    displayName: 'Base',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
    explorer: base.blockExplorers?.default?.url || '',
  },
  '34443': {
    displayName: 'Mode',
    logo: 'https://avatars.githubusercontent.com/u/139873699?s=200&v=4',
    explorer: mode.blockExplorers?.default?.url || '',
  },
  '10': {
    displayName: 'Optimism',
    logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png?v=040',
    explorer: optimism.blockExplorers?.default?.url || '',
  },
};

export const EvmChainIdMap = {
  Gnosis: 100,
  Base: 8453,
  Mode: 34443,
  Optimism: 10,
} as const;
export type EvmChainId = (typeof EvmChainIdMap)[keyof typeof EvmChainIdMap];

export const EvmChainName = {
  [EvmChainIdMap.Gnosis]: EvmChainDetails[EvmChainIdMap.Gnosis].displayName,
  [EvmChainIdMap.Base]: EvmChainDetails[EvmChainIdMap.Base].displayName,
  [EvmChainIdMap.Mode]: EvmChainDetails[EvmChainIdMap.Mode].displayName,
  [EvmChainIdMap.Optimism]: EvmChainDetails[EvmChainIdMap.Optimism].displayName,
} as const;
export type EvmChainName = ValueOf<typeof EvmChainName>;

export const toHexChainId = (chainId: number | string): string => {
  return `0x${Number(chainId).toString(16)}`;
};
