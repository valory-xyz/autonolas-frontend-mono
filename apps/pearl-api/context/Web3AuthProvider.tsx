import { WEB3AUTH_NETWORK } from '@web3auth/modal';
import {
  type Web3AuthContextConfig,
  Web3AuthProvider as Web3AuthPackageProvider,
} from '@web3auth/modal/react';
import { PropsWithChildren } from 'react';

import { CHAIN_CONFIGS } from '../utils/web3auth';

// const clientId = `${process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID}`;
const clientId = `${process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID_STAGING}`; // TODO: replace with above one

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    modalConfig: {
      connectors: {
        metamask: {
          label: 'MetaMask',
          showOnModal: false,
        },
        auth: {
          label: 'Auth',
          showOnModal: true,
        },
      },
    },
  },
};

const getWeb3AuthProviderConfig = (defaultChainId?: number): Web3AuthContextConfig => {
  if (!defaultChainId) return web3AuthContextConfig;

  const defaultChainHex = `0x${defaultChainId.toString(16)}`;
  const currentChain = Object.values(CHAIN_CONFIGS).find(
    (chain) => chain.chainId === defaultChainHex,
  );

  return {
    ...web3AuthContextConfig,
    web3AuthOptions: {
      ...web3AuthContextConfig.web3AuthOptions,
      defaultChainId: defaultChainHex,
      chains: currentChain ? [currentChain] : undefined,
    },
  };
};

type Web3AuthProviderProps = PropsWithChildren & { defaultChainId?: number };

export const Web3AuthProvider = ({ children, defaultChainId }: Web3AuthProviderProps) => {
  return (
    <Web3AuthPackageProvider config={getWeb3AuthProviderConfig(defaultChainId)}>
      {children}
    </Web3AuthPackageProvider>
  );
};
