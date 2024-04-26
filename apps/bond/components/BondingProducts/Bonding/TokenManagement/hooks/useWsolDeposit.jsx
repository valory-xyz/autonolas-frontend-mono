import { Program } from '@coral-xyz/anchor';
import idl from 'common-util/abiAndAddresses/liquidityLockbox.json';
import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import Decimal from 'decimal.js';
import { increaseLiquidityQuoteByInputTokenWithParams } from '@orca-so/whirlpools-sdk';
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import {
  SVM_EMPTY_ADDRESS,
  configureAndSendCurrentTransaction,
  notifySvmSpecificError,
} from '../utils';
import { useGetOrCreateAssociatedTokenAccount } from './useGetOrCreateAssociatedTokenAccount';
import { useWhirlpool } from './useWhirlpool';
import {
  SOL,
  BRIDGED_TOKEN_MINT,
  LOCKBOX,
  ORCA,
  PDA_POSITION_ACCOUNT,
  POSITION,
  POSITION_MINT,
  PROGRAM_ID,
  TICK_ARRAY_LOWER,
  TICK_ARRAY_UPPER,
  TOKEN_VAULT_A,
  TOKEN_VAULT_B,
  WHIRLPOOL,
  tickLowerIndex,
  tickUpperIndex,
  CONNECT_SVM_WALLET,
} from '../constants';

const getOlasAmount = async (connection, walletPublicKey, tokenAddress) => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    walletPublicKey,
    { programId: TOKEN_PROGRAM_ID },
  );

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
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    walletPublicKey,
    { programId: TOKEN_PROGRAM_ID },
  );

  let bridgedTokenAmount = 0n;
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if (accountData.mint.toString() === BRIDGED_TOKEN_MINT.toString()) {
      bridgedTokenAmount = accountData.amount;
    }
  });

  return bridgedTokenAmount;
};

const createSolTransferTransaction = (
  walletKey,
  tokenOwnerAccountA,
  tokenMaxA,
) => {
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
  const { svmWalletPublicKey, connection, anchorProvider } =
    useSvmConnectivity();
  const { getWhirlpoolData } = useWhirlpool();
  const { signTransaction } = useWallet();

  const customGetOrCreateAssociatedTokenAccount =
    useGetOrCreateAssociatedTokenAccount();
  const program = new Program(idl, PROGRAM_ID, anchorProvider);

  const getDepositIncreaseLiquidityQuote = async ({ sol, slippage }) => {
    const { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB } =
      await getWhirlpoolData();
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

    const solMax = DecimalUtil.fromBN(
      quote.tokenMaxA,
      whirlpoolTokenA.decimals,
    ).toFixed(whirlpoolTokenA.decimals);

    const olasMax = DecimalUtil.fromBN(
      quote.tokenMaxB,
      whirlpoolTokenB.decimals,
    ).toFixed(whirlpoolTokenB.decimals);

    const liquidity = quote.liquidityAmount.toString();
    return { solMax, olasMax, liquidity };
  };

  const checkIfNoEnoughOlas = async (whirlpoolTokenB, olasMax) => {
    const olasAmount = await getOlasAmount(
      connection,
      svmWalletPublicKey,
      whirlpoolTokenB.mint,
    );
    const noEnoughOlas = DecimalUtil.fromBN(olasMax).greaterThan(
      DecimalUtil.fromBN(olasAmount),
    );
    return noEnoughOlas;
  };

  const deposit = async ({ sol, slippage }) => {
    if (!svmWalletPublicKey) {
      notifyError(CONNECT_SVM_WALLET);
      return null;
    }

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();
    const quote = await getDepositIncreaseLiquidityQuote({ sol, slippage });
    const { solMax, olasMax } = await getDepositTransformedQuote(quote);

    // OLAS associated token account MUST always exist when the person bonds
    const tokenOwnerAccountB = await getAssociatedTokenAddress(
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );

    const accountInfo = await connection.getAccountInfo(tokenOwnerAccountB);
    if (!accountInfo) {
      notifyError('OLAS Associated token account does not exist');
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
      notifySvmSpecificError(
        'You do not have the WSOL-OLAS LP account, please try again.',
      );
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
        notifySvmSpecificError(
          'Error creating token account for WSOL ATA',
          error,
        );
        console.error(error);
        return null;
      }
    } else {
      // Check if the user has enough WSOL
      const wsolAmount = await getOlasAmount(
        connection,
        svmWalletPublicKey,
        whirlpoolTokenA.mint,
      );
      const noEnoughWsol = DecimalUtil.fromBN(solMax).greaterThan(
        DecimalUtil.fromBN(wsolAmount),
      );

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
        quote.tokenMaxA,
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
        .deposit(quote.liquidityAmount, quote.tokenMaxA, quote.tokenMaxB)
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

    const bridgedToken = await getBridgeTokenAmount(
      connection,
      svmWalletPublicKey,
    );
    return bridgedToken.toString();
  };

  return {
    getDepositIncreaseLiquidityQuote,
    getDepositTransformedQuote,
    deposit,
  };
};
