import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { useCallback } from 'react';

import { wagmiConfig } from 'common-util/config/wagmi';
import { ADDRESSES } from 'common-util/constants/addresses';
import { depositoryParams, uniswapV2PairParams } from 'common-util/Contracts/params';
import { useHelpers } from 'common-util/hooks/useHelpers';

export const useDeposit = () => {
  const { account, chainId } = useHelpers();

  const hasSufficientTokenRequest = useCallback(
    async ({ token: productToken, tokenAmount }) => {
      const treasuryAddress = ADDRESSES[chainId].treasury;
      const response = await readContract(wagmiConfig, {
        ...uniswapV2PairParams(productToken, chainId),
        functionName: 'allowance',
        args: [account, treasuryAddress],
      });

      // if allowance is greater than or equal to token amount
      // then user has sufficient token
      return BigInt(response) >= BigInt(tokenAmount);
    },
    [account, chainId],
  );

  const getLpBalanceRequest = useCallback(
    async ({ token }) => {
      return readContract(wagmiConfig, {
        ...uniswapV2PairParams(token, chainId),
        functionName: 'balanceOf',
        args: [account],
      });
    },
    [account, chainId],
  );

  /**
   * Approves the treasury contract to spend the token
   */
  const approveRequest = useCallback(
    async ({ token, amountToApprove }) => {
      const treasuryAddress = ADDRESSES[chainId].treasury;
      const { request } = await simulateContract(wagmiConfig, {
        ...uniswapV2PairParams(token, chainId),
        functionName: 'approve',
        args: [treasuryAddress, amountToApprove],
        account,
      });
      const hash = await writeContract(wagmiConfig, request);
      return waitForTransactionReceipt(wagmiConfig, { hash });
    },
    [account, chainId],
  );

  const depositRequest = useCallback(
    async ({ productId, tokenAmount }) => {
      const { request } = await simulateContract(wagmiConfig, {
        ...depositoryParams(chainId),
        functionName: 'deposit',
        args: [productId, tokenAmount],
        account,
      });
      const hash = await writeContract(wagmiConfig, request);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      return receipt.transactionHash;
    },
    [account, chainId],
  );

  return {
    hasSufficientTokenRequest,
    getLpBalanceRequest,
    approveRequest,
    depositRequest,
  };
};
