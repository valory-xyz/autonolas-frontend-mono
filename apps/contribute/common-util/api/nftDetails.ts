/* eslint-disable no-await-in-loop */
import { readContract } from '@wagmi/core';
import axios from 'axios';
import { findIndex, memoize, toLower } from 'lodash';
import { Address } from 'viem';

import { mintNftParams } from 'common-util/Contracts/params';
import { getChainId } from 'common-util/functions';
import { wagmiConfig } from 'components/Login/config';

const getTotalSupply = memoize(async () => {
  try {
    const chainId = getChainId();
    if (chainId === undefined) return;
    const params = mintNftParams(chainId);
    if (!params) return;
    const total = await readContract(wagmiConfig, {
      ...params,
      functionName: 'totalSupply',
    });
    return total as bigint;
  } catch (e) {
    console.error(e);
    throw e;
  }
});

export const getLatestMintedNft = memoize(async (account: Address | string | undefined) => {
  if (!account) return { details: null, tokenId: null };
  try {
    const chainId = getChainId();
    if (chainId === undefined) return { details: null, tokenId: null };
    const params = mintNftParams(chainId);
    if (!params) return { details: null, tokenId: null };

    const total = await getTotalSupply();
    if (total === undefined) return { details: null, tokenId: null };

    const ownerCalls: Promise<Address>[] = [];
    for (let i = 1n; i <= total; i += 1n) {
      ownerCalls.push(
        readContract(wagmiConfig, {
          ...params,
          functionName: 'ownerOf',
          args: [i],
        }) as Promise<Address>,
      );
    }

    const ownerList = await Promise.all(ownerCalls);

    /**
     * find the element in reverse order to fetch the latest
     */
    const latestNftIndex = findIndex(ownerList, (e) => toLower(e) === toLower(account));

    if (latestNftIndex !== -1) {
      const tokenId = `${Number(latestNftIndex) + 1}`;
      const infoUrl = (await readContract(wagmiConfig, {
        ...params,
        functionName: 'tokenURI',
        args: [tokenId],
      })) as string;

      if (infoUrl) {
        const value = await axios.get(infoUrl);
        return { details: value.data, tokenId };
      }
      return { details: null, tokenId: null };
    }

    return { details: null, tokenId: null };
  } catch (e) {
    console.error(e);
    throw e;
  }
});
