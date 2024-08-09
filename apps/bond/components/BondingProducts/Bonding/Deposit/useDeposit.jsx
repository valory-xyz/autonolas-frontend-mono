import { useCallback } from 'react';

import { getEstimatedGasLimit } from 'libs/util-functions/src';

import { ADDRESSES } from 'common-util/constants/addresses';
import {
  getDepositoryContract,
  getUniswapV2PairContract,
  sendTransaction,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';

export const useDeposit = () => {
  const { account, chainId } = useHelpers();

  const hasSufficientTokenRequest = useCallback(
    async ({ token: productToken, tokenAmount }) => {
      const contract = getUniswapV2PairContract(productToken);
      const treasuryAddress = ADDRESSES[chainId].treasury;
      const response = await contract.methods.allowance(account, treasuryAddress).call();

      // if allowance is greater than or equal to token amount
      // then user has sufficient token
      const hasEnoughAllowance = response >= tokenAmount;
      return hasEnoughAllowance;
    },
    [account, chainId],
  );

  const getLpBalanceRequest = useCallback(
    async ({ token }) => {
      console.log('token', token);
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
      console.log('contract', contract);

      const treasuryAddress = ADDRESSES[chainId].treasury;
      console.log('treasuryAddress', treasuryAddress);

      const fnApprove = contract.methods
        .approve(treasuryAddress, amountToApprove)
        .send({ from: account });
      console.log('fnApprove', fnApprove);

      // const estimatedGas = await getEstimatedGasLimit(fnApprove, account);
      // console.log('estimatedGas', estimatedGas);

      // const fn = fnApprove.send({
      //   from: account,
      //   gasLimit: estimatedGas,
      // });
      // console.log('fn', fn);

      // const response = await sendTransaction(fnApprove, account);
      // console.log('response', response);

      const response = await fnApprove;

      return response;
    },
    [account, chainId],
  );

  const depositRequest = useCallback(
    async ({ productId, tokenAmount }) => {
      console.log('inside deposit Request');

      const contract = getDepositoryContract();
      console.log('contract', contract);

      const fnDeposit = contract.methods.deposit(productId, tokenAmount).send({ from: account });
      console.log('fnDeposit', fnDeposit);

      // const estimatedGas = await getEstimatedGasLimit(fnDeposit, account);
      // console.log('estimatedGas', estimatedGas);

      // const fn = fnDeposit.send({ from: account, gasLimit: estimatedGas });
      // console.log('fn', fn);

      const response = await fnDeposit;
      // const response = await sendTransaction(fnDeposit, account);
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
