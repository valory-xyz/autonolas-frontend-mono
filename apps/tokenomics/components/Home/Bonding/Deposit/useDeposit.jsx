import { useCallback } from 'react';
import { ethers } from 'ethers';

import {
  getEstimatedGasLimit,
  sendTransaction,
  getDepositoryContract,
  getUniswapV2PairContract,
} from 'common-util/functions';

import { ADDRESSES } from 'common-util/constants/addresses';

import { useHelpers } from 'common-util/hooks/useHelpers';

const { BigNumber } = ethers;

export const useDeposit = () => {
  const { account, chainId } = useHelpers();

  const hasSufficientTokenRequest = useCallback(
    async ({ token: productToken, tokenAmount }) => {
      const contract = getUniswapV2PairContract(productToken);
      const treasuryAddress = ADDRESSES[chainId].treasury;
      const response = await contract.methods
        .allowance(account, treasuryAddress)
        .call();

      // if allowance is greater than or equal to token amount
      // then user has sufficient token
      const hasEnoughAllowance = BigNumber.from(response).gte(
        BigNumber.from(tokenAmount),
      );
      return hasEnoughAllowance;
    },
    [account, chainId],
  );

  const getLpBalanceRequest = useCallback(
    async ({ token }) => {
      const contract = getUniswapV2PairContract(token);
      const response = await contract.methods.balanceOf(account).call();
      return response.toString();
    },
    [account],
  );

  /**
   * Approves the treasury contract to spend the token
   */
  const approveRequest = useCallback(
    async ({ token, amountToApprove }) => {
      const contract = getUniswapV2PairContract(token);
      const treasuryAddress = ADDRESSES[chainId].treasury;
      const fnApprove = contract.methods.approve(
        treasuryAddress,
        amountToApprove,
      );
      const estimatedGas = await getEstimatedGasLimit(fnApprove, account);
      const fn = await fnApprove.send({
        from: account,
        gasLimit: estimatedGas,
      });

      const response = await sendTransaction(fn, account);
      return response;
    },
    [account, chainId],
  );

  const depositRequest = useCallback(
    async ({ productId, tokenAmount }) => {
      const contract = getDepositoryContract();
      const fn = contract.methods
        .deposit(productId, tokenAmount)
        .send({ from: account });

      const response = await sendTransaction(fn, account);
      return response?.transactionHash;
    },
    [account],
  );

  return {
    hasSufficientTokenRequest,
    getLpBalanceRequest,
    approveRequest,
    depositRequest,
  };
};
