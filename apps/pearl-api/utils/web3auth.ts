import { EvmDisplayName } from './chain';

export const CHAIN_CONFIGS: Record<
  string,
  {
    chainNamespace: 'eip155';
    chainId: string;
    rpcTarget: string;
    displayName: string;
    ticker: string;
    tickerName: string;
    blockExplorerUrl: string;
    logo: string;
  }
> = {
  gnosis: {
    chainNamespace: 'eip155',
    chainId: '0x64',
    rpcTarget: 'https://rpc.gnosischain.com',
    displayName: EvmDisplayName.Gnosis,
    ticker: 'xDAI',
    tickerName: 'xDAI',
    blockExplorerUrl: 'https://gnosisscan.io/',
    logo: 'https://gnosisscan.io/assets/xdai/images/svg/logos/token-secondary-dim.svg',
  },
  base: {
    chainNamespace: 'eip155',
    chainId: '0x2105',
    rpcTarget: 'https://mainnet.base.org',
    displayName: EvmDisplayName.Base,
    ticker: 'ETH',
    tickerName: 'Ether',
    blockExplorerUrl: 'https://basescan.org/',
    logo: 'https://gnosisscan.io/assets/xdai/images/svg/logos/token-secondary-dim.svg',
  },
  optimism: {
    chainNamespace: 'eip155',
    chainId: '0xa',
    rpcTarget: 'https://mainnet.optimism.io',
    displayName: EvmDisplayName.Optimism,
    ticker: 'ETH',
    tickerName: 'Ether',
    blockExplorerUrl: 'https://optimistic.etherscan.io/',
    logo: 'https://gnosisscan.io/assets/xdai/images/svg/logos/token-secondary-dim.svg',
  },
  mode: {
    chainNamespace: 'eip155',
    chainId: '0x868b',
    rpcTarget: 'https://rpc.mode.network',
    displayName: EvmDisplayName.Mode,
    ticker: 'MODE',
    tickerName: 'Mode',
    blockExplorerUrl: 'https://explorer.mode.network/',
    logo: 'https://gnosisscan.io/assets/xdai/images/svg/logos/token-secondary-dim.svg',
  },
};
