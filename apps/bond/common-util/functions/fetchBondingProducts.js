import { readContract, readContracts } from '@wagmi/core';

import { DEFAULT_CHAIN_ID, wagmiConfig } from 'common-util/config/wagmi';
import { depositoryParams } from 'common-util/Contracts/params';
import { getProductDetailsFromIds } from 'components/BondingProducts/Bonding/BondingList/useBondingList';

/**
 * Server-side read of the bonding products, composed exactly as the client hook composes them so
 * the two cannot drift. Only what needs a browser is supplied differently — see the `deps` below.
 */
export async function fetchBondingProducts({ isActive = true } = {}) {
  const chainId = DEFAULT_CHAIN_ID;

  const productIdList = await readContract(wagmiConfig, {
    ...depositoryParams(chainId),
    functionName: 'getProducts',
    args: [isActive],
  });

  if (!productIdList || productIdList.length === 0) return [];

  const products = await getProductDetailsFromIds(productIdList, {
    chainId,
    multicall: ({ contracts }) => readContracts(wagmiConfig, { contracts }),
    // The Solana price is a wallet-adapter hook with no server equivalent. 0 rather than null
    // (downstream runs `toBigInt` on it); the summary omits a falsy price rather than printing it.
    getCurrentPriceWhirlpool: async () => 0,
  });

  return products.map((product, index) => ({
    ...product,
    id: productIdList[index],
    key: productIdList[index],
  }));
}
