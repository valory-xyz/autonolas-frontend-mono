import get from 'lodash/get';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { getMintContract } from 'common-util/Contracts';
import { getEstimatedGasLimit } from 'common-util/functions/requests';
import { GATEWAY_URL } from 'libs/util-constants/src';

const pattern = /ipfs:\/\/+/g;
export const getAutonolasTokenUri = (tokenUri: string) =>
  (tokenUri || '').replace(pattern, GATEWAY_URL);

export const mintNft = (account: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const contract = getMintContract();
    if (!contract) return;
    const mintFn = contract.methods.mint();

    getEstimatedGasLimit(mintFn, account).then((estimatedGas) => {
      mintFn
        .send({ from: account, gas: estimatedGas })
        .then((response: { events: { Transfer: { returnValues: { id: string } } } }) => {
          notifySuccess('Successfully Minted');
          const id = get(response, 'events.Transfer.returnValues.id');
          resolve(id);
        })
        .catch((e: Error) => {
          notifyError('Error: could not mint NFT');
          window.console.log('Error occurred on minting NFT');
          reject(e);
        });
    });
  });

export async function pollNftDetails(id: string): Promise<object | undefined> {
  const contract = getMintContract();
  if (!contract) return;
  const infoUrl = await contract.methods.tokenURI(`${id}`).call();

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
