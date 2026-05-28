import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { Address } from 'viem';

import { notifyError } from 'libs/util-functions/src';
import { estimateGasWithBuffer } from 'libs/util-functions/src/lib/estimateGasWithBuffer';

import { GNOSIS_SAFE_CONTRACT } from 'common-util/AbiAndAddresses';
import { dispenserParams } from 'common-util/Contracts/params';
import { wagmiConfig } from 'common-util/Login/config';

import { DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS } from '../../util/constants';
import { checkIfGnosisSafe, getEthersProvider } from './index';

const FALLBACK_HANDLER_STORAGE_SLOT =
  '0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5';

/**
 * Check whether `account` can receive an ERC721 mint. For an EOA, always true;
 * for a Gnosis Safe, additionally verifies threshold/owners/fallback handler.
 */
export const checkIfERC721Receive = async (account: Address, ownerAddress: Address) => {
  const provider = getEthersProvider();
  const isSafe = await checkIfGnosisSafe(account, provider);

  if (isSafe) {
    try {
      const [threshold, owners] = await Promise.all([
        readContract(wagmiConfig, {
          address: account,
          abi: GNOSIS_SAFE_CONTRACT.abi,
          functionName: 'getThreshold',
        }) as Promise<bigint>,
        readContract(wagmiConfig, {
          address: account,
          abi: GNOSIS_SAFE_CONTRACT.abi,
          functionName: 'getOwners',
        }) as Promise<readonly Address[]>,
      ]);

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
  try {
    const callParams = {
      ...dispenserParams,
      functionName: 'claimOwnerIncentives' as const,
      args: [unitTypes.map(BigInt), unitIds.map(BigInt)],
      account,
    };
    const { request } = await simulateContract(wagmiConfig, callParams);
    const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
    const hash = await writeContract(wagmiConfig, { ...request, gas });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return receipt.transactionHash;
  } catch (error) {
    console.error('Error occurred on claiming owner incentives', error);
    throw error;
  }
};
