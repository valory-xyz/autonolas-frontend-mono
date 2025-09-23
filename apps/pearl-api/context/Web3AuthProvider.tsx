import { WEB3AUTH_NETWORK } from '@web3auth/modal';
import {
  type Web3AuthContextConfig,
  Web3AuthProvider as Web3AuthPackageProvider,
} from '@web3auth/modal/react';
import { PropsWithChildren } from 'react';

const clientId = `${process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID}`;

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
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

export const Web3AuthProvider = ({ children }: PropsWithChildren) => {
  return (
    <Web3AuthPackageProvider config={web3AuthContextConfig}>{children}</Web3AuthPackageProvider>
  );
};
