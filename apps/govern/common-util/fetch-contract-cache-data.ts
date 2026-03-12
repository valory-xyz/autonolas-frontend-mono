/**
 * Fetches contract config + metadata from chain (RPC) and IPFS.
 * Used by the contracts API route for read-through cache population.
 * Server-side only (Node/Edge).
 */

import { createPublicClient, http } from 'viem';
import type { Address } from 'viem';

import { GATEWAY_URL, HASH_PREFIX, RPC_URLS } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { bigintToStr } from 'libs/util-functions/src';

import type { GovernContractCacheData } from 'types';

const IPFS_FETCH_TIMEOUT_MS = 5000;
const ZERO_HASH = '0x' + '0'.repeat(64);

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
  if (!metadataHash || metadataHash === ZERO_HASH) {
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

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function toMetadataHashString(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'bigint') return '0x' + raw.toString(16).padStart(64, '0');
  return '0x' + '0'.repeat(64);
}

/**
 * Fetches config and metadata for a staking contract from RPC + IPFS.
 * Returns null if the address is not a valid staking contract or RPC fails.
 * Uses Promise.allSettled so partial data is still written if some fields are unsupported.
 */
export async function fetchContractCacheDataFromChain(
  chainId: number,
  address: string,
): Promise<GovernContractCacheData | null> {
  const client = getChainClient(chainId);
  if (!client) return null;

  try {
    const contractArgs = { address: address as Address, abi: STAKING_TOKEN.abi };

    const [
      maxNumServicesRes,
      rewardsPerSecondRes,
      minStakingDepositRes,
      livenessPeriodRes,
      minStakingDurationRes,
      maxNumInactivityPeriodsRes,
      timeForEmissionsRes,
      numAgentInstancesRes,
      agentIdsRes,
      thresholdRes,
      configHashRes,
      proxyHashRes,
      activityCheckerRes,
      metadataHashRes,
    ] = await Promise.allSettled([
      client.readContract({ ...contractArgs, functionName: 'maxNumServices' }),
      client.readContract({ ...contractArgs, functionName: 'rewardsPerSecond' }),
      client.readContract({ ...contractArgs, functionName: 'minStakingDeposit' }),
      client.readContract({ ...contractArgs, functionName: 'livenessPeriod' }),
      client.readContract({ ...contractArgs, functionName: 'minStakingDuration' }),
      client.readContract({ ...contractArgs, functionName: 'maxNumInactivityPeriods' }),
      client.readContract({ ...contractArgs, functionName: 'timeForEmissions' }),
      client.readContract({ ...contractArgs, functionName: 'numAgentInstances' }),
      client.readContract({ ...contractArgs, functionName: 'getAgentIds' }),
      client.readContract({ ...contractArgs, functionName: 'threshold' }),
      client.readContract({ ...contractArgs, functionName: 'configHash' }),
      client.readContract({ ...contractArgs, functionName: 'proxyHash' }),
      client.readContract({ ...contractArgs, functionName: 'activityChecker' }),
      client.readContract({ ...contractArgs, functionName: 'metadataHash' }),
    ]);

    const hasValidKeyCall =
      maxNumServicesRes.status === 'fulfilled' ||
      metadataHashRes.status === 'fulfilled' ||
      configHashRes.status === 'fulfilled' ||
      proxyHashRes.status === 'fulfilled';
    if (!hasValidKeyCall) {
      return null;
    }

    const rawMetadataHash = settled(metadataHashRes, null);
    const metadataHashStr = toMetadataHashString(rawMetadataHash);
    const meta = await fetchMetadata(metadataHashStr);

    // Do not cache when metadata was expected but fetch failed (empty name/description)
    if (metadataHashStr !== ZERO_HASH && !meta.name && !meta.description) {
      return null;
    }

    const rawAgentIds = settled(agentIdsRes, [] as bigint[]) as bigint[];
    const agentIds = Array.isArray(rawAgentIds) ? rawAgentIds.map((id) => id.toString()) : [];

    return {
      metadata: { name: meta.name, description: meta.description },
      config: {
        maxNumServices: bigintToStr(settled(maxNumServicesRes, null)),
        rewardsPerSecond: bigintToStr(settled(rewardsPerSecondRes, null)),
        minStakingDeposit: bigintToStr(settled(minStakingDepositRes, null)),
        livenessPeriod: bigintToStr(settled(livenessPeriodRes, null)),
        minStakingDuration: bigintToStr(settled(minStakingDurationRes, null)),
        maxNumInactivityPeriods: bigintToStr(settled(maxNumInactivityPeriodsRes, null)),
        timeForEmissions: bigintToStr(settled(timeForEmissionsRes, null)),
        numAgentInstances: bigintToStr(settled(numAgentInstancesRes, null)),
        agentIds,
        threshold: bigintToStr(settled(thresholdRes, null)),
        configHash:
          typeof settled(configHashRes, null) === 'string'
            ? (settled(configHashRes, '') as string)
            : '',
        proxyHash:
          typeof settled(proxyHashRes, null) === 'string'
            ? (settled(proxyHashRes, '') as string)
            : '',
        activityChecker:
          typeof settled(activityCheckerRes, null) === 'string'
            ? (settled(activityCheckerRes, '') as string)
            : '',
      },
    };
  } catch {
    return null;
  }
}
