import { CONNECTOR_NAMESPACES, CustomChainConfig, Web3Auth } from '@web3auth/modal';
import { base, Chain, gnosis, mode, optimism } from 'viem/chains';

import { EvmChainDetails, EvmChainIdMap } from './chain';

const toWeb3AuthChainConfig = (chain: Chain, logo: string): CustomChainConfig => {
  return {
    chainNamespace: CONNECTOR_NAMESPACES.EIP155,
    chainId: `0x${chain.id.toString(16)}`,
    rpcTarget: chain.rpcUrls.default.http[0],
    displayName: chain.name,
    ticker: chain.nativeCurrency.symbol,
    tickerName: chain.nativeCurrency.name,
    blockExplorerUrl: chain.blockExplorers?.default?.url || '',
    logo,
  };
};

export const CHAIN_CONFIGS: Record<string, CustomChainConfig> = {
  gnosis: toWeb3AuthChainConfig(gnosis, EvmChainDetails[EvmChainIdMap.Gnosis].logo),
  base: toWeb3AuthChainConfig(base, EvmChainDetails[EvmChainIdMap.Base].logo),
  optimism: toWeb3AuthChainConfig(optimism, EvmChainDetails[EvmChainIdMap.Optimism].logo),
  mode: toWeb3AuthChainConfig(mode, EvmChainDetails[EvmChainIdMap.Mode].logo),
};
