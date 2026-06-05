/**
 * NOTE: Safe multisig txs are built with local GPL-free helpers
 * (common-util/functions/safeTransactions), replacing @gnosis.pm/safe-contracts (GPL-3.0).
 * Still on ethers-v5 to match the historical encoding (verified byte-identical).
 *
 * How to test `onMultisigSubmit` function (step 3 in service)
 * - First, you’ll need two accounts; let's call them `account1` and `account2`.
 * - Create a service with account1 as the owner, using one 1 as an example.
 * - Navigate to the newly created service.
 * - Start with the first step and click the "Activate Registration" button.
 * - In the second step, switch to `account2` and add `account1` as the "Agent instance address".
 * - In the third step, switch back to `account1` and select 1st radio button (creates new multisig) and click the "Submit" button.
 * - In the fourth step, use `account1` to "Terminate" the service.
 * - In the fifth step, switch to `account2` and "Unbond" the service.
 * NOW, start from the 1st step to test the multisig update functionality.
 * - In the first step, switch to `account1` click "Activate Registration" button.
 * - In the second step, switch to `account2` and add any valid address as the "Agent instance address" (fetch from the explorer of the same chain).
 * - In the third step, switch back `account1` and select 2nd radio button and click "Submit" button - this will trigger the `onMultisigSubmit` function.
 *
 * NOTE: It's the same steps for gnosis-safe and metamask-like wallets.
 */
import {
  getBlockNumber,
  getPublicClient,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { ethers } from 'ethers-v5';

import { RPC_URLS } from 'libs/util-constants/src';
import { getEthersV5Provider } from 'libs/util-functions/src';

import { GNOSIS_SAFE_CONTRACT, MULTI_SEND_CONTRACT } from 'common-util/AbiAndAddresses';
import { gnosisSafeParams } from 'common-util/Contracts/params';
import { safeMultiSend } from 'common-util/Contracts/addresses';
import { SUPPORTED_CHAINS } from 'common-util/Login';
import { wagmiConfig } from 'common-util/Login/config';
import { checkIfGnosisSafe } from 'common-util/functions';
import { buildMultiSendSafeTx, buildSafeTransaction } from 'common-util/functions/safeTransactions';

import { isHashApproved } from './helpers';

const ZEROS_24 = '0'.repeat(24);
const ZEROS_64 = '0'.repeat(64);

const EIP712_SAFE_TX_TYPE = {
  SafeTx: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'value' },
    { type: 'bytes', name: 'data' },
    { type: 'uint8', name: 'operation' },
    { type: 'uint256', name: 'safeTxGas' },
    { type: 'uint256', name: 'baseGas' },
    { type: 'uint256', name: 'gasPrice' },
    { type: 'address', name: 'gasToken' },
    { type: 'address', name: 'refundReceiver' },
    { type: 'uint256', name: 'nonce' },
  ],
};

export const onMultisigSubmit = async ({
  multisig,
  threshold,
  agentInstances,
  serviceOwner,
  chainId,
  handleStep3Deploy,
  radioValue,
  account,
}) => {
  const multisigContract = new ethers.Contract(
    multisig,
    GNOSIS_SAFE_CONTRACT.abi,
    ethers.getDefaultProvider(RPC_URLS[chainId]),
  );
  const nonce = await multisigContract.nonce();

  const callData = [];
  const txs = [];

  // Add the addresses, but keep the threshold the same
  for (let i = 0; i < agentInstances.length; i += 1) {
    callData[i] = multisigContract.interface.encodeFunctionData('addOwnerWithThreshold', [
      agentInstances[i],
      1,
    ]);
    txs[i] = buildSafeTransaction({
      to: multisig,
      data: callData[i],
      nonce: 0,
    });
  }

  callData.push(
    multisigContract.interface.encodeFunctionData('removeOwner', [
      agentInstances[0],
      serviceOwner,
      threshold,
    ]),
  );
  txs.push(
    buildSafeTransaction({
      to: multisig,
      data: callData[callData.length - 1],
      nonce: 0,
    }),
  );

  const multiSendContract = new ethers.Contract(
    safeMultiSend[chainId][0],
    MULTI_SEND_CONTRACT.abi,
    ethers.getDefaultProvider(RPC_URLS[chainId]),
  );

  const safeTx = buildMultiSendSafeTx(multiSendContract, txs, nonce);
  const provider = getEthersV5Provider(SUPPORTED_CHAINS, RPC_URLS);
  const isSafe = await checkIfGnosisSafe(account, provider);

  try {
    // logic to deal with gnosis-safe
    if (isSafe) {
      // Create a message hash from the multisend transaction
      const messageHash = await multisigContract.getTransactionHash(
        safeTx.to,
        safeTx.value,
        safeTx.data,
        safeTx.operation,
        safeTx.safeTxGas,
        safeTx.baseGas,
        safeTx.gasPrice,
        safeTx.gasToken,
        safeTx.refundReceiver,
        nonce,
      );
      const numericChainId = Number(chainId);
      const safeParams = gnosisSafeParams(multisig, numericChainId);
      // @wagmi/core 2.6.17 doesn't export getContractEvents as a top-level
      // action — only as a method on the public client returned by
      // getPublicClient. Use that for both the initial filter query below
      // and inside isHashApproved.
      const publicClient = getPublicClient(wagmiConfig, { chainId: numericChainId });
      const startingBlock = await getBlockNumber(wagmiConfig, { chainId: numericChainId });

      // Get the signature bytes based on the account address, since it had its tx pre-approved
      const signatureBytes = `0x${ZEROS_24}${account.slice(2)}${ZEROS_64}01`;

      const safeExecData = multisigContract.interface.encodeFunctionData('execTransaction', [
        safeTx.to,
        safeTx.value,
        safeTx.data,
        safeTx.operation,
        safeTx.safeTxGas,
        safeTx.baseGas,
        safeTx.gasPrice,
        safeTx.gasToken,
        safeTx.refundReceiver,
        signatureBytes,
      ]);

      // Redeploy the service updating the multisig with new owners and threshold
      const packedData = ethers.utils.solidityPack(['address', 'bytes'], [multisig, safeExecData]);

      // Check if the hash was already approved. We bound the lookback to
      // ~9k blocks (stays under Alchemy's 10k eth_getLogs window) before the
      // current block — fromBlock: 0n would be rejected by most public RPCs
      // on a 20M-block chain. The user reaches this step within minutes of
      // approving, so 9k blocks (~30h on Ethereum, longer on L2s) is far
      // more than enough to catch a fresh approval.
      const filterArgs = { approvedHash: messageHash, owner: account };
      const eventsFromBlock = BigInt(Math.max(0, Number(startingBlock) - 9_000));
      const existingEvents = await publicClient.getContractEvents({
        address: multisig,
        abi: GNOSIS_SAFE_CONTRACT.abi,
        eventName: 'ApproveHash',
        args: filterArgs,
        fromBlock: eventsFromBlock,
        toBlock: 'latest',
      });

      // if hash was already approved, call the deploy function right away.
      if (existingEvents.length > 0) {
        await handleStep3Deploy(radioValue, packedData);
      } else {
        // else submit approveHash, wait until the on-chain event surfaces, then deploy
        const { request } = await simulateContract(wagmiConfig, {
          ...safeParams,
          functionName: 'approveHash',
          args: [messageHash],
          account,
        });
        const txHash = await writeContract(wagmiConfig, request);
        window.console.log('safeTx', txHash);
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: numericChainId });

        await isHashApproved({
          multisig,
          chainId: numericChainId,
          startingBlock,
          approvedHash: messageHash,
          owner: account,
        });
        await handleStep3Deploy(radioValue, packedData);
      }
    }

    // logic to deal with metamask like wallets
    else {
      const signer = provider.getSigner();

      const getSignatureBytes = async () => {
        // Get the signature of a multisend transaction
        const signatureBytes = await signer._signTypedData(
          { verifyingContract: multisig, chainId },
          EIP712_SAFE_TX_TYPE,
          safeTx,
        );

        // take last 2 characters
        const last2Char = signatureBytes.slice(-2);

        // check if the last2Char is less than 2
        const value = parseInt(last2Char, 16);

        // if less than 2, add chainId * 2 + 35
        if (value < 2) {
          // correct value updated by the ledger
          const newValue = value + 27;

          // convert to hex (eg. 37 -> 25, 38 -> 26)
          const updatedLast2Char = newValue.toString(16);

          // update the last 2 char
          const updatedSignatureBytes = signatureBytes.slice(0, -2) + updatedLast2Char;
          return updatedSignatureBytes;
        }

        return signatureBytes;
      };

      const signatureBytes = await getSignatureBytes();
      const safeExecData = multisigContract.interface.encodeFunctionData('execTransaction', [
        safeTx.to,
        safeTx.value,
        safeTx.data,
        safeTx.operation,
        safeTx.safeTxGas,
        safeTx.baseGas,
        safeTx.gasPrice,
        safeTx.gasToken,
        safeTx.refundReceiver,
        signatureBytes,
      ]);
      const packedData = ethers.utils.solidityPack(['address', 'bytes'], [multisig, safeExecData]);

      await handleStep3Deploy(radioValue, packedData);
    }
  } catch (error) {
    window.console.log('Error in signing:');
    console.error(error);
  }
};
