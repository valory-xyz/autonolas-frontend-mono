/**
 * Blob storage for the govern app: cached staking contract config and IPFS metadata.
 *
 * The storage logic is shared with operate; only the prefix, token and payload shape differ.
 * The prefix is versioned — v2 invalidates snapshots poisoned by transient RPC failures at
 * population time (empty name / configHash / proxyHash / activityChecker) written before the
 * completeness guard in fetchContractCacheDataFromChain.
 */

import type { GovernContractCacheData, GovernContractCacheSnapshot } from 'types';

import {
  createContractCacheStore,
  isContractCacheSnapshot,
} from 'libs/util-functions/src/lib/contractCacheStore';

export const { getContractCache, setContractCache } =
  createContractCacheStore<GovernContractCacheData>({
    prefix: 'govern/contracts/v2',
    getToken: () => process.env.GOVERN_BLOB_READ_WRITE_TOKEN,
  });

/** Used by the client-side contract page, which fetches a blob URL directly. */
export const isGovernContractCacheSnapshot = (data: unknown): data is GovernContractCacheSnapshot =>
  isContractCacheSnapshot<GovernContractCacheData>(data);
