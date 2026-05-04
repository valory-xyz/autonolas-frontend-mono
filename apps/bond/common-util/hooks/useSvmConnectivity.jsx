import { useMemo } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, setProvider } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';

// Read-only Anchor wallet stub. Replaces `@coral-xyz/anchor/dist/cjs/nodewallet`,
// which transitively imports `fs` and breaks Turbopack browser bundles in Next 16.
const READONLY_KEYPAIR = Keypair.generate();
const NODE_WALLET = {
  publicKey: READONLY_KEYPAIR.publicKey,
  payer: READONLY_KEYPAIR,
  signTransaction: async (tx) => {
    tx.partialSign(READONLY_KEYPAIR);
    return tx;
  },
  signAllTransactions: async (txs) =>
    txs.map((tx) => {
      tx.partialSign(READONLY_KEYPAIR);
      return tx;
    }),
};

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
