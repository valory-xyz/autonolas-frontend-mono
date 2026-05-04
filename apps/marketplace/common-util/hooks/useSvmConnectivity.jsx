import { useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, setProvider } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';

import idl from '../AbiAndAddresses/ServiceRegistrySolana.json';
import { SOLANA_ADDRESSES } from '../Contracts/addresses';

// Read-only Anchor wallet stub. Replaces `@coral-xyz/anchor/dist/cjs/nodewallet`,
// which transitively imports `fs` and breaks Turbopack browser bundles in Next 16.
// Mirrors the original NodeWallet's signing behaviour so a VersionedTransaction
// path doesn't throw if it's ever exercised.
const READONLY_KEYPAIR = Keypair.generate();
const isVersionedTx = (tx) => 'version' in tx;
const signOne = (tx) => {
  if (isVersionedTx(tx)) tx.sign([READONLY_KEYPAIR]);
  else tx.partialSign(READONLY_KEYPAIR);
  return tx;
};
const NODE_WALLET = {
  publicKey: READONLY_KEYPAIR.publicKey,
  payer: READONLY_KEYPAIR,
  signTransaction: async (tx) => signOne(tx),
  signAllTransactions: async (txs) => txs.map(signOne),
};
const TEMP_PUBLIC_KEY = new web3.PublicKey(process.env.NEXT_PUBLIC_SVM_PUBLIC_KEY);

/**
 * hook to get svm info
 */
export const useSvmConnectivity = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const actualWallet = useMemo(() => wallet?.publicKey || null, [wallet]);

  // program addresses
  const solanaAddresses = SOLANA_ADDRESSES;

  // provider for anchor, if wallet is not connected, use node wallet
  // (node wallet is used read-only operations, like fetching data from blockchain)
  const customProvider = useMemo(() => {
    if (!actualWallet) {
      const provider = new AnchorProvider(connection, NODE_WALLET, {
        commitment: 'processed',
      });
      setProvider(provider);
      return provider;
    }

    const currentWallet = window.solana ? wallet : Keypair.generate();
    return new AnchorProvider(connection, currentWallet, {
      commitment: 'processed',
    });
  }, [connection, wallet, actualWallet]);

  const programId = useMemo(
    () => new PublicKey(solanaAddresses.serviceRegistry),
    [solanaAddresses.serviceRegistry],
  );

  const program = useMemo(
    () => new Program(idl, programId, customProvider),
    [customProvider, programId],
  );

  const walletPublicKey = useMemo(() => actualWallet || TEMP_PUBLIC_KEY, [actualWallet]);

  return {
    walletPublicKey,
    /**
     * Public key of the wallet used for read-only operations
     */
    tempWalletPublicKey: TEMP_PUBLIC_KEY,
    connection,
    program,
    programId,
    solanaAddresses,
  };
};
