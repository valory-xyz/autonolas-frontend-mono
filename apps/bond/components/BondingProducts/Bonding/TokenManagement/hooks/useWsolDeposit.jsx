import { Program } from '@coral-xyz/anchor';
import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import { increaseLiquidityQuoteByInputTokenWithParams } from '@orca-so/whirlpools-sdk';
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction } from '@solana/web3.js';
import Decimal from 'decimal.js';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';
import idl from 'libs/util-contracts/src/lib/abiAndAddresses/liquidityLockbox.json';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';

import {
  BRIDGED_TOKEN_MINT,
  CONNECT_SVM_WALLET,
  LOCKBOX,
  ORCA,
  PDA_POSITION_ACCOUNT,
  POSITION,
  POSITION_MINT,
  PROGRAM_ID,
  SOL,
  SVM_AMOUNT_DIVISOR,
  TICK_ARRAY_LOWER,
  TICK_ARRAY_UPPER,
  TOKEN_VAULT_A,
  TOKEN_VAULT_B,
  WHIRLPOOL,
  tickLowerIndex,
  tickUpperIndex,
} from '../constants';
import {
  SVM_EMPTY_ADDRESS,
  configureAndSendCurrentTransaction,
  notifySvmSpecificError,
} from '../utils';
import { useGetOrCreateAssociatedTokenAccount } from './useGetOrCreateAssociatedTokenAccount';
import { useWhirlpool } from './useWhirlpool';

const GetSomeOlas = () => (
  <>
    OLAS Associated token account does not exist.&nbsp;
    <Link
      href="https://www.orca.so/?tokenIn=So11111111111111111111111111111111111111112&tokenOut=Ez3nzG9ofodYCvEmw73XhQ87LWNYVRM2s7diB5tBZPyM"
      target="_blank"
      rel="noreferrer noopener"
    >
      Get some OLAS first {UNICODE_SYMBOLS.EXTERNAL_LINK}.
    </Link>
  </>
);

const getOlasAmount = async (connection, walletPublicKey, tokenAddress) => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  let tokenAmount = 0n;
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if (accountData.mint.toString() === tokenAddress.toString()) {
      tokenAmount = accountData.amount;
    }
  });

  return tokenAmount;
};

const getBridgeTokenAmount = async (connection, walletPublicKey) => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  let bridgedTokenAmount = 0n;
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if (accountData.mint.toString() === BRIDGED_TOKEN_MINT.toString()) {
      bridgedTokenAmount = accountData.amount;
    }
  });

  return bridgedTokenAmount;
};

const createSolTransferTransaction = (walletKey, tokenOwnerAccountA, tokenMaxA) => {
  const solTransferTransaction = [];
  solTransferTransaction.push(
    SystemProgram.transfer({
      fromPubkey: walletKey,
      toPubkey: tokenOwnerAccountA,
      lamports: tokenMaxA,
    }),
  );
  solTransferTransaction.push(createSyncNativeInstruction(tokenOwnerAccountA));
  const transaction = new Transaction().add(...solTransferTransaction);
  return transaction;
};

const logSolTransferError = (error) => {
  if (error instanceof Error && 'message' in error) {
    console.error('Program Error:', error);
    console.error('Error Message:', error.message);
  } else {
    console.error('Transaction Error:', error);
  }
};

export const useWsolDeposit = () => {
  const { svmWalletPublicKey, connection, anchorProvider } = useSvmConnectivity();
  const { getWhirlpoolData } = useWhirlpool();
  const { signTransaction } = useWallet();
  const [bridgedTokenAmount, setBridgedTokenAmount] = useState(null);

  const customGetOrCreateAssociatedTokenAccount = useGetOrCreateAssociatedTokenAccount();
  const program = new Program(idl, PROGRAM_ID, anchorProvider);

  const getLatestBridgeTokenAmount = useCallback(async () => {
    if (!svmWalletPublicKey) return;
    if (!connection) return;

    getBridgeTokenAmount(connection, svmWalletPublicKey).then((bridgedToken) => {
      const token = bridgedToken.toString();
      if (Number(token) > 0) {
        setBridgedTokenAmount(token / SVM_AMOUNT_DIVISOR);
      }
    });
  }, [connection, svmWalletPublicKey]);

  useEffect(() => {
    getLatestBridgeTokenAmount();
  }, [getLatestBridgeTokenAmount]);

  const getDepositIncreaseLiquidityQuote = async ({ sol, slippage }) => {
    const { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));
    const inputTokenAmount = DecimalUtil.toBN(new Decimal(sol), 9);

    return increaseLiquidityQuoteByInputTokenWithParams({
      tokenMintA: whirlpoolTokenA.mint,
      tokenMintB: whirlpoolTokenB.mint,
      sqrtPrice: whirlpoolData.sqrtPrice,
      tickCurrentIndex: whirlpoolData.tickCurrentIndex,
      tickLowerIndex,
      tickUpperIndex,
      inputTokenMint: SOL,
      inputTokenAmount,
      slippageTolerance,
    });
  };

  const getDepositTransformedQuote = async (quote) => {
    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    const solMax = DecimalUtil.fromBN(quote.tokenMaxA, whirlpoolTokenA.decimals).toFixed(
      whirlpoolTokenA.decimals,
    );

    const olasMax = DecimalUtil.fromBN(quote.tokenMaxB, whirlpoolTokenB.decimals).toFixed(
      whirlpoolTokenB.decimals,
    );

    const liquidity = quote.liquidityAmount.toString();
    return { solMax, olasMax, liquidity };
  };

  const checkIfNoEnoughOlas = async (whirlpoolTokenB, olasMax) => {
    const olasAmount = await getOlasAmount(connection, svmWalletPublicKey, whirlpoolTokenB.mint);
    const noEnoughOlas = DecimalUtil.fromBN(olasMax).greaterThan(DecimalUtil.fromBN(olasAmount));
    return noEnoughOlas;
  };

  const deposit = async ({ sol, slippage }) => {
    if (!svmWalletPublicKey) {
      notifyError(CONNECT_SVM_WALLET);
      return null;
    }

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    const solInputInLamportInBn = DecimalUtil.toBN(new Decimal(sol), 9);
    const solInputInLamport = BigInt(solInputInLamportInBn.toString());

    const quote = await getDepositIncreaseLiquidityQuote({
      sol,
      slippage,
    });
    const { solMax, olasMax } = await getDepositTransformedQuote(quote);

    // OLAS associated token account MUST always exist when the person bonds
    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );

    const accountInfo = await connection.getAccountInfo(tokenOwnerAccountB);
    if (!accountInfo) {
      // If the user has no associated token account, they need to get some OLAS first
      notifyError(<GetSomeOlas />);
      return null;
    }

    const noEnoughOlas = await checkIfNoEnoughOlas(whirlpoolTokenB, olasMax);
    if (noEnoughOlas) {
      notifyError('Not enough OLAS balance');
      return null;
    }

    // Check if the user has the correct token account and it is required to deposit
    if (tokenOwnerAccountB.toString() === SVM_EMPTY_ADDRESS) {
      notifyError('You do not have the correct token account');
      return null;
    }

    const bridgedTokenAccount = await customGetOrCreateAssociatedTokenAccount(
      BRIDGED_TOKEN_MINT,
      svmWalletPublicKey,
    );
    if (!bridgedTokenAccount) {
      notifySvmSpecificError('You do not have the WSOL-OLAS LP account, please try again.');
      return null;
    }

    // Transfer SOL to associated token account and use SyncNative to update wrapped SOL balance
    // Wrap the required amount of SOL by transferring SOL to WSOL ATA and syncing native
    const tokenOwnerAccountA = await getAssociatedTokenAddress(
      whirlpoolTokenA.mint,
      svmWalletPublicKey,
    );

    let isWrapRequired = false;
    const newAccountInfo = await connection.getAccountInfo(tokenOwnerAccountA);
    if (!newAccountInfo) {
      isWrapRequired = true;

      // Create token account to hold wrapped SOL
      const ataTransaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          svmWalletPublicKey,
          tokenOwnerAccountA,
          svmWalletPublicKey,
          whirlpoolTokenA.mint,
        ),
      );

      try {
        await configureAndSendCurrentTransaction(
          ataTransaction,
          connection,
          svmWalletPublicKey,
          signTransaction,
        );
      } catch (error) {
        notifySvmSpecificError('Error creating token account for WSOL ATA', error);
        console.error(error);
        return null;
      }
    } else {
      // Check if the user has enough WSOL
      const wsolAmount = await getOlasAmount(connection, svmWalletPublicKey, whirlpoolTokenA.mint);
      const noEnoughWsol = solInputInLamport > wsolAmount;

      if (noEnoughWsol) {
        isWrapRequired = true;
      }
    }

    if (isWrapRequired) {
      const balance = await connection.getBalance(svmWalletPublicKey);

      // Check if the user has enough SOL balance
      if (solMax > balance) {
        notifyError('Not enough SOL balance');
        return null;
      }

      const transaction = createSolTransferTransaction(
        svmWalletPublicKey,
        tokenOwnerAccountA,
        solInputInLamport,
      );

      try {
        await configureAndSendCurrentTransaction(
          transaction,
          connection,
          svmWalletPublicKey,
          signTransaction,
        );

        notifySuccess('SOL transfer successful');
      } catch (error) {
        notifyError('Error transferring SOL to WSOL ATA');
        logSolTransferError();
        return null;
      }
    }

    try {
      await program.methods
        .deposit(quote.liquidityAmount, solInputInLamportInBn, quote.tokenMaxB)
        .accounts({
          position: POSITION,
          positionMint: POSITION_MINT,
          pdaPositionAccount: PDA_POSITION_ACCOUNT,
          whirlpool: WHIRLPOOL,
          tokenOwnerAccountA,
          tokenOwnerAccountB,
          tokenVaultA: TOKEN_VAULT_A,
          tokenVaultB: TOKEN_VAULT_B,
          tickArrayLower: TICK_ARRAY_LOWER,
          tickArrayUpper: TICK_ARRAY_UPPER,
          bridgedTokenAccount,
          bridgedTokenMint: BRIDGED_TOKEN_MINT,
          lockbox: LOCKBOX,
          whirlpoolProgram: ORCA,
        })
        .rpc();

      notifySuccess('Deposit successful');
    } catch (error) {
      notifySvmSpecificError('Failed to deposit', error);
      console.error(error);
      return null;
    }

    await getLatestBridgeTokenAmount(); // refetch bridged token amount

    return quote.liquidityAmount.toString();
  };

  return {
    getDepositIncreaseLiquidityQuote,
    getDepositTransformedQuote,
    deposit,
    bridgedTokenAmount,
  };
};
