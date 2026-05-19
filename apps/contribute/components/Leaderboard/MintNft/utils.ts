import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import get from 'lodash/get';
import { Address, decodeEventLog } from 'viem';

import { GATEWAY_URL } from 'libs/util-constants/src';
import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { mintNftParams } from 'common-util/Contracts/params';
import { getChainId } from 'common-util/functions';
import { wagmiConfig } from 'components/Login/config';

const pattern = /ipfs:\/\/+/g;
export const getAutonolasTokenUri = (tokenUri: string) =>
  (tokenUri || '').replace(pattern, GATEWAY_URL);

export const mintNft = async (account: string): Promise<string> => {
  const chainId = getChainId();
  if (chainId === undefined) throw new Error('Cannot determine chain ID');
  const params = mintNftParams(chainId);
  if (!params) throw new Error('Mint NFT contract not deployed on this chain');

  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...params,
      functionName: 'mint',
      account: account as Address,
    });
    const hash = await writeContract(wagmiConfig, request);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

    notifySuccess('Successfully Minted');

    // Pull the new token id out of the Transfer event in the receipt logs.
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== params.address.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({
          abi: params.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'Transfer') {
          const args = decoded.args as unknown as { id?: string; tokenId?: bigint };
          // Mint NFT ABIs differ across chains — preserve the original key shape
          // (`returnValues.id`) where possible.
          return get(args, 'id') || (args.tokenId !== undefined ? args.tokenId.toString() : '');
        }
      } catch {
        // log emitted by same address but not in the ABI
      }
    }

    return '';
  } catch (e) {
    notifyError('Error: could not mint NFT');
    window.console.log('Error occurred on minting NFT');
    throw e;
  }
};

export async function pollNftDetails(id: string): Promise<object | undefined> {
  const chainId = getChainId();
  if (chainId === undefined) return;
  const params = mintNftParams(chainId);
  if (!params) return;

  const infoUrl = (await readContract(wagmiConfig, {
    ...params,
    functionName: 'tokenURI',
    args: [`${id}`],
  })) as string;

  return new Promise((resolve, reject) => {
    /* eslint-disable-next-line consistent-return */
    const interval = setInterval(async () => {
      window.console.log('Fetching NFT details...');

      try {
        const response = await fetch(infoUrl);

        // poll until the URL is resolved with 200 response
        if (response.status === 200) {
          const json = await response.json();
          const image = get(json, 'image');

          if (image) {
            window.console.log('NFT details: ', json);
            clearInterval(interval);
            resolve(json);
          }
        }
      } catch (error) {
        reject(error);
      }
    }, 4000);
  });
}
