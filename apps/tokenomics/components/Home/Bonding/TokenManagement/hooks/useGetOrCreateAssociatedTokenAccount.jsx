import { useCallback } from 'react';
import { Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { configureAndSendCurrentTransaction } from '../utils';
import { CONNECT_SVM_WALLET } from '../constants';

/**
 * hook to get or create associated token account
 */
export const useGetOrCreateAssociatedTokenAccount = () => {
  const { connection } = useConnection();
  const { svmWalletPublicKey } = useSvmConnectivity();
  const { signTransaction } = useWallet();

  return useCallback(
    async (mintToken, owner = svmWalletPublicKey) => {
      try {
        if (!svmWalletPublicKey || !signTransaction) {
          notifyError(CONNECT_SVM_WALLET);
          return null;
        }

        const associatedToken = await getAssociatedTokenAddress(
          mintToken,
          owner,
        );

        const accountInfo = await connection.getAccountInfo(associatedToken);
        if (accountInfo) return associatedToken;

        // Create the associated token account if it does not exist
        const transactionInstructions = [];
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            svmWalletPublicKey,
            associatedToken,
            owner,
            mintToken,
          ),
        );

        const transaction = new Transaction().add(...transactionInstructions);
        await configureAndSendCurrentTransaction(
          transaction,
          connection,
          svmWalletPublicKey,
          signTransaction,
        );

        notifySuccess('Associated token account created');
        const newAccountInfo = await connection.getAccountInfo(associatedToken);
        return newAccountInfo;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [connection, svmWalletPublicKey, signTransaction],
  );
};
