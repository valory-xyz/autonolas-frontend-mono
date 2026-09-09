import { readContract, readContracts } from '@wagmi/core';

import { wagmiConfig, SUPPORTED_CHAINS } from 'common-util/config/wagmi';
import { depositoryParams } from 'common-util/Contracts/params';
import { getProductDetailsFromIds } from 'components/BondingProducts/Bonding/BondingList/useBondingList';

/**
 * Server-side read of the bonding products, for the `/bonding-products` ISR render.
 *
 * Reuses the exact composition the client uses (`getProductDetailsFromIds`), so the pre-rendered
 * rows cannot drift from the interactive table. Only the three things that hook could not resolve
 * without a browser are supplied differently:
 *
 * - `chainId` — `getChainId()` returns undefined with no `window`, so default to the first
 *   supported chain, which is what it resolves to for a visitor without a wallet anyway.
 * - `multicall` — wagmi-core's `readContracts` rather than a `usePublicClient` instance.
 * - `getCurrentPriceWhirlpool` — the Solana price comes from a wallet-adapter hook with no
 *   server equivalent. It resolves to null here, so Solana products are still listed but carry
 *   no current LP price rather than a wrong one. Callers must not present a price for them.
 */
const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS[0].id;

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
    // 0, not null: downstream runs `ethers.toBigInt` over this and null is not a BigNumberish.
    // The summary omits a falsy price rather than printing 0, so nothing wrong is published.
    getCurrentPriceWhirlpool: async () => 0,
  });

  return products.map((product, index) => ({
    ...product,
    id: productIdList[index],
    key: productIdList[index],
  }));
}
