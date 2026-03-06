/**
 * Fetches contract config + metadata from chain (RPC) and IPFS.
 * Used by the contracts API route for read-through cache population.
 * Server-side only (Node/Edge).
 */

import { createPublicClient, http } from 'viem';
import type { Address } from 'viem';

import { GATEWAY_URL, HASH_PREFIX, RPC_URLS } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src';

import type { ContractCacheData } from 'types';

const IPFS_FETCH_TIMEOUT_MS = 5000;

function getChainClient(chainId: number) {
  const rpc = RPC_URLS[chainId];
  if (!rpc) return null;
  return createPublicClient({
    chain: {
      id: chainId,
      name: '',
      nativeCurrency: { decimals: 18, name: '', symbol: '' },
      rpcUrls: { default: { http: [rpc] } },
    },
    transport: http(rpc),
  });
}

async function fetchMetadata(metadataHash: string): Promise<{ name: string; description: string }> {
  if (!metadataHash || metadataHash === '0x' + '0'.repeat(64)) {
    return { name: '', description: '' };
  }
  const uri = `${HASH_PREFIX}${metadataHash.substring(2)}`;
  const url = `${GATEWAY_URL}${uri}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IPFS_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return { name: '', description: '' };
    const data = (await res.json()) as { name?: string; description?: string };
    return { name: data.name ?? '', description: data.description ?? '' };
  } catch {
    clearTimeout(timeoutId);
    return { name: '', description: '' };
  }
}

/**
 * Fetches config and metadata for a staking contract from RPC + IPFS.
 * Returns null if the address is not a valid staking contract or RPC fails.
 */
export async function fetchContractCacheDataFromChain(
  chainId: number,
  address: string,
): Promise<ContractCacheData | null> {
  const client = getChainClient(chainId);
  if (!client) return null;

  try {
    const [
      maxNumServices,
      rewardsPerSecond,
      minStakingDeposit,
      numAgentInstances,
      livenessPeriod,
      metadataHash,
    ] = await Promise.all([
      client.readContract({
        address: address as Address,
        abi: STAKING_TOKEN.abi,
        functionName: 'maxNumServices',
      }),
      client.readContract({
        address: address as Address,
        abi: STAKING_TOKEN.abi,
        functionName: 'rewardsPerSecond',
      }),
      client.readContract({
        address: address as Address,
        abi: STAKING_TOKEN.abi,
        functionName: 'minStakingDeposit',
      }),
      client.readContract({
        address: address as Address,
        abi: STAKING_TOKEN.abi,
        functionName: 'numAgentInstances',
      }),
      client.readContract({
        address: address as Address,
        abi: STAKING_TOKEN.abi,
        functionName: 'livenessPeriod',
      }),
      client.readContract({
        address: address as Address,
        abi: STAKING_TOKEN.abi,
        functionName: 'metadataHash',
      }),
    ]);

    const metadataHashStr =
      typeof metadataHash === 'string'
        ? metadataHash
        : '0x' + (metadataHash as bigint).toString(16).padStart(64, '0');
    const meta = await fetchMetadata(metadataHashStr);

    return {
      config: {
        maxNumServices: Number(maxNumServices ?? 0),
        rewardsPerSecond: String(rewardsPerSecond ?? 0),
        minStakingDeposit: String(minStakingDeposit ?? 0),
        numAgentInstances: String(numAgentInstances ?? 1),
        livenessPeriod: String(livenessPeriod ?? 0),
      },
      metadata: { name: meta.name, description: meta.description },
      operateDetails: { availableOn: null },
    };
  } catch {
    return null;
  }
}
