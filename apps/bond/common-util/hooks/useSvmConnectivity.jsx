import { useMemo } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, setProvider } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

const NODE_WALLET = new NodeWallet(Keypair.generate());

export const useSvmConnectivity = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const anchorProvider = useMemo(
    () =>
      new AnchorProvider(connection, anchorWallet, {
        commitment: 'processed',
      }),
    [connection, anchorWallet],
  );

  const nodeProvider = useMemo(
    () =>
      new AnchorProvider(connection, NODE_WALLET, {
        commitment: 'processed',
      }),
    [connection],
  );

  setProvider(nodeProvider);

  return {
    connection,
    wallet,
    anchorWallet,
    anchorProvider,
    svmWalletPublicKey: anchorWallet?.publicKey,
    isSvmWalletConnected: !!anchorWallet?.publicKey,
    nodeProvider,
  };
};
