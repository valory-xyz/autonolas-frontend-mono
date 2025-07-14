/* eslint-disable import/no-unresolved */

/* eslint-disable import/no-extraneous-dependencies */
import { create } from 'ipfs-http-client';
import { base32 } from 'multiformats/bases/base32';

import { GATEWAY_URL } from 'util/constants';

import { TweetOrThread } from '.';

export const getFirstTenCharsOfTweet = (tweetText: TweetOrThread['text']) => {
  if (typeof tweetText === 'string') {
    return tweetText.substring(0, 10);
  }
  return (tweetText[0] || '').substring(0, 10);
};

const ipfs = create({
  host: process.env.NEXT_PUBLIC_REGISTRY_URL,
  port: 443,
  protocol: 'https',
});

/**
 *
 * @param {string | ArrayBuffer} file
 * @returns hash to the file
 */
export const uploadFileToIpfs = async (file: FileReader['result'] | null) => {
  if (!file) return null;

  const response = await ipfs.add(file);
  const hash = response.cid.toV1().toString(base32.encoder);
  return hash;
};

export const uploadFilesToIpfs = async (files: TweetOrThread['media']) => {
  const mediaPromises: Promise<string>[] = [];

  files.forEach((file) => {
    mediaPromises.push(
      new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        const fileExtension = file.type.split('/').pop();
        fileReader.onloadend = async () => {
          try {
            // Upload the file to IPFS
            const hash = await uploadFileToIpfs(fileReader.result);
            resolve(`${hash}.${fileExtension}`);
          } catch (error) {
            console.error(error);
            reject(error);
          }
        };
        fileReader.readAsArrayBuffer(file);
      }),
    );
  });

  return Promise.allSettled(mediaPromises);
};

const extensionRegex = /\.[^.]+$/;
export const getMediaSrc = (hashWithExtension: string) => {
  const hash = hashWithExtension.replace(extensionRegex, '');

  return `${GATEWAY_URL}${hash}`;
};

const handleFulfilled = (items: PromiseSettledResult<string>[]) =>
  items.reduce<string[]>((acc, item) => {
    if (item.status === 'fulfilled') {
      acc.push(item.value);
    }
    return acc;
  }, []);

export const generateMediaHashes = async (tweetOrThread: TweetOrThread) => {
  try {
    if (Array.isArray(tweetOrThread.text)) {
      const threadMediaPromises = await uploadFilesToIpfs(tweetOrThread.media);
      return handleFulfilled(threadMediaPromises);
    }

    const uploadedMedia = await uploadFilesToIpfs(tweetOrThread.media);
    return handleFulfilled(uploadedMedia);
  } catch (error) {
    console.error(error);
    return [];
  }
};
