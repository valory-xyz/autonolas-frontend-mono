import { multicall, readContract } from '@wagmi/core';
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

    // Batch the ownerOf reads into a single multicall request. The previous
    // Promise.all over N parallel readContract calls hit RPC rate-limits on
    // many-token contracts; multicall aggregates them into one eth_call.
    const calls = [];
    for (let i = 1n; i <= total; i += 1n) {
      calls.push({
        ...params,
        functionName: 'ownerOf',
        args: [i],
      });
    }
    const responses = await multicall(wagmiConfig, {
      contracts: calls,
      allowFailure: true,
    });
    const ownerList = responses.map((r) =>
      r.status === 'success' ? (r.result as Address) : ('' as Address),
    );

    // find the element in reverse order to fetch the latest
    const latestNftIndex = findIndex(ownerList, (e) => toLower(e) === toLower(account));

    if (latestNftIndex !== -1) {
      const tokenId = `${latestNftIndex + 1}`;
      const infoUrl = (await readContract(wagmiConfig, {
        ...params,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)],
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
