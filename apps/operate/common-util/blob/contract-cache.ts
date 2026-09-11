/**
 * Blob storage for the operate app: cached staking contract config, metadata, and
 * operate-specific details. These do not change for a given contract, so they are stored once
 * and read from cache. Live data (availableRewards, serviceIds, epochCounter, tsCheckpoint) is
 * never cached.
 *
 * Read-through flow (in GET /api/contracts/[chainId]/[address]): call getContractCache; on miss,
 * fetch from chain via fetchContractCacheDataFromChain (RPC + IPFS), then setContractCache.
 *
 * The storage logic is shared with govern; only the prefix, token and payload shape differ.
 */

import type { ContractCacheData } from 'types';

import { createContractCacheStore } from 'libs/util-functions/src/lib/contractCacheStore';

export const { getContractCache, setContractCache } = createContractCacheStore<ContractCacheData>({
  prefix: 'operate/contracts',
  getToken: () => process.env.OPERATE_BLOB_READ_WRITE_TOKEN,
});
