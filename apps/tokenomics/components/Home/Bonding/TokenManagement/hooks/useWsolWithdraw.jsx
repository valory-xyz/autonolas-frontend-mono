import { useCallback } from 'react';
import { Program } from '@coral-xyz/anchor';
import idl from 'common-util/abiAndAddresses/liquidityLockbox.json';
import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import { decreaseLiquidityQuoteByLiquidityWithParams } from '@orca-so/whirlpools-sdk';
import {
  AccountLayout,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import Decimal from 'decimal.js';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { useGetOrCreateAssociatedTokenAccount } from './useGetOrCreateAssociatedTokenAccount';
import { useWhirlpool } from './useWhirlpool';
import {
  BRIDGED_TOKEN_MINT,
  FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_A,
  FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_B,
  LOCKBOX,
  ORCA,
  PDA_POSITION_ACCOUNT,
  POSITION,
  PROGRAM_ID,
  TICK_ARRAY_LOWER,
  TICK_ARRAY_UPPER,
  TOKEN_VAULT_A,
  TOKEN_VAULT_B,
  WHIRLPOOL,
  POSITION_MINT,
  tickLowerIndex,
  tickUpperIndex,
  CONNECT_SVM_WALLET,
} from '../constants';
import { notifySvmSpecificError } from '../utils';

const TOKEN_MINT_ERROR =
  'You do not have the correct token account, please try again.';

const useBridgedTokenAccount = () => {
  const { svmWalletPublicKey } = useSvmConnectivity();

  return useCallback(async () => {
    if (!svmWalletPublicKey) return null;

    const bridgedTokenAccount = await getAssociatedTokenAddress(
      BRIDGED_TOKEN_MINT,
      svmWalletPublicKey,
    );

    return bridgedTokenAccount;
  }, [svmWalletPublicKey]);
};

export const useWsolWithdraw = () => {
  const { svmWalletPublicKey, anchorProvider } = useSvmConnectivity();
  const { getWhirlpoolData } = useWhirlpool();
  const getBridgedTokenAccount = useBridgedTokenAccount();
  const customGetOrCreateAssociatedTokenAccount =
    useGetOrCreateAssociatedTokenAccount();
  const program = new Program(idl, PROGRAM_ID, anchorProvider);

  const withdrawTransformedQuote = async (quote) => {
    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    const wsolMin = DecimalUtil.fromBN(
      quote.tokenMinA,
      whirlpoolTokenA.decimals,
    ).toFixed(whirlpoolTokenA.decimals);

    const olasMin = DecimalUtil.fromBN(
      quote.tokenMinB,
      whirlpoolTokenB.decimals,
    ).toFixed(whirlpoolTokenB.decimals);

    return { wsolMin, olasMin };
  };

  const withdrawDecreaseLiquidityQuote = async ({ amount, slippage }) => {
    const { whirlpoolData } = await getWhirlpoolData();
    const slippageTolerance = Percentage.fromDecimal(new Decimal(slippage));
    const liquidity = DecimalUtil.toBN(new Decimal(amount), 0);

    return decreaseLiquidityQuoteByLiquidityWithParams({
      sqrtPrice: whirlpoolData.sqrtPrice,
      tickCurrentIndex: whirlpoolData.tickCurrentIndex,
      tickLowerIndex,
      tickUpperIndex,
      liquidity,
      slippageTolerance,
    });
  };

  /**
   * Fetch the maximum amount of bridged tokens that the user can withdraw.
   * User must have wallet connected to get the maximum amount, else it will return null.
   *
   * @returns {Promise<number | null>}
   */
  const getMaxAmount = useCallback(async () => {
    const bridgedTokenAccount = await getBridgedTokenAccount();
    if (!bridgedTokenAccount) return null;

    const tokenAccounts =
      await anchorProvider.connection.getTokenAccountsByOwner(
        svmWalletPublicKey,
        { programId: TOKEN_PROGRAM_ID },
      );

    let maxAmountInBn = -1n; // initialize to -1

    // Iterate through the token accounts of the user to find the bridged token account
    tokenAccounts.value.forEach((tokenAccount) => {
      const accountData = AccountLayout.decode(tokenAccount.account.data);
      if (accountData.mint.toString() === BRIDGED_TOKEN_MINT.toString()) {
        if (tokenAccount.pubkey.toString() === bridgedTokenAccount.toString()) {
          maxAmountInBn = accountData.amount;
        }
      }
    });

    if (maxAmountInBn === -1n) {
      notifyError(
        'You do not have the bridged token account, please try again.',
      );
      return null;
    }

    const maxAmount = Number(maxAmountInBn.toString());
    return maxAmount;
  }, [svmWalletPublicKey, anchorProvider, getBridgedTokenAccount]);

  /**
   * Withdraw from the lockbox
   */
  const withdraw = async ({ amount, slippage, userWallet }) => {
    const bridgedTokenAccount = await getBridgedTokenAccount({ userWallet });
    if (!bridgedTokenAccount) {
      notifyError(CONNECT_SVM_WALLET);
      return;
    }

    const { whirlpoolTokenA, whirlpoolTokenB } = await getWhirlpoolData();

    // Get the tokenA ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountA = await customGetOrCreateAssociatedTokenAccount(
      whirlpoolTokenA.mint,
      svmWalletPublicKey,
    );
    if (!tokenOwnerAccountA) {
      notifyError(TOKEN_MINT_ERROR);
      return;
    }

    // Get the tokenB ATA of the userWallet address, and if it does not exist, create it
    const tokenOwnerAccountB = await customGetOrCreateAssociatedTokenAccount(
      whirlpoolTokenB.mint,
      svmWalletPublicKey,
    );
    if (!tokenOwnerAccountB) {
      notifyError(TOKEN_MINT_ERROR);
      return;
    }

    const quote = await withdrawDecreaseLiquidityQuote({ amount, slippage });
    try {
      await program.methods
        .withdraw(quote.liquidityAmount, quote.tokenMinA, quote.tokenMinB)
        .accounts({
          lockbox: LOCKBOX,
          whirlpoolProgram: ORCA,
          whirlpool: WHIRLPOOL,
          tokenProgram: TOKEN_PROGRAM_ID,
          position: POSITION,
          positionMint: POSITION_MINT,
          bridgedTokenAccount,
          bridgedTokenMint: BRIDGED_TOKEN_MINT,
          pdaPositionAccount: PDA_POSITION_ACCOUNT,
          tokenOwnerAccountA,
          tokenOwnerAccountB,
          feeCollectorTokenOwnerAccountA: FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_A,
          feeCollectorTokenOwnerAccountB: FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_B,
          tokenVaultA: TOKEN_VAULT_A,
          tokenVaultB: TOKEN_VAULT_B,
          tickArrayLower: TICK_ARRAY_LOWER,
          tickArrayUpper: TICK_ARRAY_UPPER,
        })
        .rpc();

      notifySuccess('Withdraw successful');
    } catch (error) {
      notifySvmSpecificError('Failed to withdraw', error);
      console.error(error);
    }
  };

  return {
    withdrawTransformedQuote,
    withdrawDecreaseLiquidityQuote,
    withdraw,
    getMaxAmount,
  };
};
