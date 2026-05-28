import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import get from 'lodash/get';
import { Address, decodeEventLog, getAddress } from 'viem';

import { GATEWAY_URL } from 'libs/util-constants/src';
import { estimateGasWithBuffer, notifyError, notifySuccess } from 'libs/util-functions/src';

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
    const callParams = {
      ...params,
      functionName: 'mint' as const,
      account: account as Address,
    };
    const { request } = await simulateContract(wagmiConfig, callParams);
    const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
    const hash = await writeContract(wagmiConfig, { ...request, gas });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

    notifySuccess('Successfully Minted');

    // Pull the new token id out of the Transfer event in the receipt logs.
    // Both mint NFT ABIs (mainnet + goerli) declare Transfer(from, to, id) with
    // `id` as uint256 (indexed), so viem decodes it as bigint. Convert to
    // string at the boundary to match the store typing
    // (store/setup.ts nftDetails.tokenId: string).
    const expected = getAddress(params.address);
    for (const log of receipt.logs) {
      if (getAddress(log.address) !== expected) continue;
      try {
        const decoded = decodeEventLog({
          abi: params.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'Transfer') {
          const args = decoded.args as unknown as { id: bigint };
          return String(args.id);
        }
      } catch {
        // log emitted by same address but not in the ABI
      }
    }

    return '';
  } catch (e) {
    notifyError('Error: could not mint NFT');
    console.error('Error occurred on minting NFT', e);
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
    args: [BigInt(id)],
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
