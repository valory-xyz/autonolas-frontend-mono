import { Contract } from 'ethers';
import { Contract as ContractV5 } from 'ethers-v5';

import { notifyError, notifyWarning } from '../notifications';
import {
  getChainId,
  getEthersProvider,
  getEthersV5Provider,
  pollTransactionDetails,
} from './helpers';
import { Chain, RpcUrl } from './types';

export const SAFE_API_MAINNET =
  'https://safe-transaction-mainnet.safe.global/api/v1/multisig-transactions';
export const SAFE_API_GOERLI =
  'https://safe-transaction-goerli.safe.global/api/v1/multisig-transactions';

export const SAFE_API_GNOSIS =
  'https://safe-transaction-gnosis-chain.safe.global/api/v1/multisig-transactions';

export const SAFE_API_POLYGON =
  'https://safe-transaction-polygon.safe.global/api/v1/multisig-transactions';

/**
 * returns the gnosis-safe API url based on the chainId.
 * Here is the ist of available gnosis safe transaction service
 * @see https://docs.safe.global/core-api/transaction-service-supported-networks
 */
export const getUrl = (hash: string, chainId: number) => {
  // TODO: update the URL for supported chains
  switch (chainId) {
    case 5:
      return `${process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_GOERLI'] || SAFE_API_GOERLI}/${hash}`;
    case 100:
      return `${process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_GNOSIS'] || SAFE_API_GNOSIS}/${hash}`;
    case 137:
      return `${process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_POLYGON'] || SAFE_API_POLYGON}/${hash}`;
    default:
      return `${process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_MAINNET'] || SAFE_API_MAINNET}/${hash}`;
  }
};

/**
 * poll until the hash has been approved
 * uses legacy ethers v5 version for compatibility
 * with some smart contracts (as they use ethers v5), otherwise
 * some functions calls may fail
 */
export const sendTransaction = async (
  sendFn: Contract | ContractV5,
  account = (window as any)?.MODAL_PROVIDER?.accounts[0],
  {
    supportedChains,
    rpcUrls,
    isLegacy,
  }: { supportedChains: Chain[]; rpcUrls: RpcUrl; isLegacy?: boolean },
) => {
  const provider = isLegacy
    ? getEthersV5Provider(supportedChains, rpcUrls)
    : getEthersProvider(supportedChains, rpcUrls);

  try {
    const isGnosisSafe = async () => {
      if (!provider) return false;

      try {
        const code = await provider.getCode(account);
        return code !== '0x';
      } catch (error) {
        console.error(error);
        return false;
      }
    };

    if (await isGnosisSafe()) {
      /**
       * Logic to deal with gnosis-safe
       * - show notification on to check gnosis-safe
       * - poll until transaction is completed
       * - return response
       */
      notifyWarning('Please submit the transaction in your safe app.');

      return sendFn.on('transactionHash', async (safeTx: string) => {
        window.console.log('safeTx', safeTx);

        /**
         * use `transactionHash`, get the hash, then poll until
         * it resolves with Output
         */
        const chainId = getChainId(supportedChains);
        if (!chainId) throw new Error('Please connect your wallet');

        try {
          const receipt = await pollTransactionDetails(safeTx, chainId);
          return receipt;
        } catch (e) {
          console.error('Error on fetching transaction details');
          throw e;
        }
      });
    } else {
      // usual send function
      return sendFn;
    }
  } catch (e) {
    notifyError('Error occurred while sending transaction');
    throw e;
  }
};
