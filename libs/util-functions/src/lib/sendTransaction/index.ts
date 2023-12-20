/* eslint-disable @typescript-eslint/no-explicit-any */
import { Web3ReceiptType, Chain, RpcUrl } from './types';
import {
  getChainId,
  getEthersProvider,
  pollTransactionDetails,
} from './helpers';
import { notifyWarning, notifyError } from '../notifications';

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
 * https://docs.safe.global/safe-core-api/available-services
 */
export const getUrl = (hash: string, chainId: number) => {
  switch (chainId) {
    case 5:
      return `${
        process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_GOERLI'] || SAFE_API_GOERLI
      }/${hash}`;
    case 100:
      return `${
        process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_GNOSIS'] || SAFE_API_GNOSIS
      }/${hash}`;
    case 137:
      return `${
        process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_POLYGON'] || SAFE_API_POLYGON
      }/${hash}`;
    default:
      return `${
        process.env['NEXT_PUBLIC_GNOSIS_SAFE_API_MAINNET'] || SAFE_API_MAINNET
      }/${hash}`;
  }
};

/**
 * poll until the hash has been approved
 */
export const sendTransaction = (
  sendFn: any,
  account = (window as any)?.MODAL_PROVIDER?.accounts[0],
  { supportedChains, rpcUrls }: { supportedChains: Chain[]; rpcUrls: RpcUrl }
) =>
  new Promise((resolve, reject) => {
    const provider = getEthersProvider(supportedChains, rpcUrls);

    provider
      .getCode(account)
      .then(async (code: string) => {
        const isGnosisSafe = code !== '0x';

        if (isGnosisSafe) {
          /**
           * Logic to deal with gnosis-safe
           * - show notification on to check gnosis-safe
           * - poll until transaction is completed
           * - return response
           */
          notifyWarning('Please submit the transaction in your safe app.');

          sendFn
            .on('transactionHash', async (safeTx: string) => {
              window.console.log('safeTx', safeTx);

              /**
               * use `transactionHash`, get the hash, then poll until
               * it resolves with Output
               */
              const chainId = getChainId(supportedChains);
              if (!chainId) throw new Error('Please connect your wallet');

              pollTransactionDetails(safeTx, chainId)
                .then((receipt) => {
                  resolve(receipt);
                })
                .catch((e) => {
                  console.error('Error on fetching transaction details');
                  reject(e);
                });
            })
            .catch((e: Error) => reject(e));
        } else {
          // usual send function
          sendFn
            .then((receipt: Web3ReceiptType) => resolve(receipt))
            .catch((e: Error) => reject(e));
        }
      })
      .catch((e: Error) => {
        notifyError('Error occurred while sending transaction');
        reject(e);
      });
  });
