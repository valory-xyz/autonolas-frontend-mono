import { Address, TransactionReceipt } from 'viem';

import { notifyError, sendTransaction } from '@autonolas/frontend-library';

import { getEstimatedGasLimit } from 'libs/util-functions/src';

import { SUPPORTED_CHAINS } from 'common-util/Login';

import { DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS } from '../../util/constants';
import { RPC_URLS, getDispenserContract, getServiceOwnerMultisigContract } from '../Contracts';
import { checkIfGnosisSafe, getEthersProvider } from './index';

const FALLBACK_HANDLER_STORAGE_SLOT =
  '0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5';

/**
 * function to check the owner address can mint.
 * BE code: https://github.com/valory-xyz/autonolas-registries/pull/54#discussion_r1031510182
 * @returns {Promise<boolean>} true if the owner address can mint
 */
export const checkIfERC721Receive = async (account: Address, ownerAddress: Address) => {
  const provider = getEthersProvider();
  const isSafe = await checkIfGnosisSafe(account, provider);

  if (isSafe) {
    try {
      const contract = getServiceOwnerMultisigContract(account);
      const threshold = await contract.methods.getThreshold().call();
      const owners = await contract.methods.getOwners().call();

      if (Number(threshold) > 0 && owners.length > 0) {
        // TODO: check and fix error: Property 'getStorageAt' does not exist on type 'JsonRpcProvider | FallbackProvider'.
        // Did you mean 'getStorage'?
        // @ts-expect-error next-line
        const contents = await provider.getStorageAt(account, FALLBACK_HANDLER_STORAGE_SLOT);

        const isInvalidContent =
          !contents || contents.slice(26) === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS.slice(2);

        if (isInvalidContent) {
          notifyError(
            `Unable to mint to ${ownerAddress} due to the absence of a fallback handler.`,
          );
          return false;
        }
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  return true;
};

export const claimOwnerIncentivesRequest = async ({
  account,
  unitTypes,
  unitIds,
}: {
  account: Address;
  unitTypes: string[];
  unitIds: string[];
}) => {
  const contract = getDispenserContract();
  try {
    const claimFn = contract.methods.claimOwnerIncentives(unitTypes, unitIds);
    const estimatedGas = await getEstimatedGasLimit(claimFn, account);
    const fn = claimFn.send({ from: account, gasLimit: estimatedGas });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS as Record<string, string>,
    });
    return (response as TransactionReceipt)?.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on claiming owner incentives');
    throw error;
  }
};
