import type { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http, type Address, zeroAddress } from 'viem';
import { mainnet } from 'viem/chains';

import {
  BLACKLISTED_STAKING_ADDRESSES,
  GATEWAY_URL,
  HASH_PREFIX,
  RPC_URLS,
} from 'libs/util-constants/src';
import {
  STAKING_FACTORY,
  STAKING_TOKEN,
  VOTE_WEIGHTING,
} from 'libs/util-contracts/src/lib/abiAndAddresses';
import {
  areAddressesEqual,
  getAddressFromBytes32,
  getBytes32FromAddress,
} from 'libs/util-functions/src';

import { getContractCache, setContractCache } from 'common-util/blob';
import type { GovernContractCacheData, GovernContractCacheInstanceParams } from 'types';

const IPFS_FETCH_TIMEOUT_MS = 5000;

function getMainnetClient() {
  const rpc = RPC_URLS[mainnet.id];
  if (!rpc) throw new Error('Mainnet RPC not configured');
  return createPublicClient({ chain: mainnet, transport: http(rpc) });
}

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

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function bigintToStr(value: unknown, fallback = '0'): string {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const mainnetClient = getMainnetClient();
    const voteWeightingAddress = (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id];
    if (!voteWeightingAddress) {
      return res.status(500).json({ error: 'VOTE_WEIGHTING not configured for mainnet' });
    }

    const nominees = (await mainnetClient.readContract({
      address: voteWeightingAddress,
      abi: VOTE_WEIGHTING.abi,
      functionName: 'getAllNominees',
    })) as { account: `0x${string}`; chainId: bigint }[];

    const filtered = nominees
      .filter((n) => n.account !== getBytes32FromAddress(zeroAddress))
      .filter((n) => {
        const addr = getAddressFromBytes32(n.account);
        return !BLACKLISTED_STAKING_ADDRESSES.some((b) => areAddressesEqual(b, addr));
      });

    let written = 0;
    let skipped = 0;
    let failed = 0;

    for (const nominee of filtered) {
      const chainId = Number(nominee.chainId);
      const address = getAddressFromBytes32(nominee.account);

      const existing = await getContractCache(chainId, address);
      if (existing) {
        skipped += 1;
        continue;
      }

      const client = getChainClient(chainId);
      if (!client) {
        failed += 1;
        continue;
      }

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

        const rawMetadataHash = settled(metadataHashRes, null);
        const metadataHashStr =
          typeof rawMetadataHash === 'string'
            ? rawMetadataHash
            : typeof rawMetadataHash === 'bigint'
              ? '0x' + rawMetadataHash.toString(16).padStart(64, '0')
              : '0x' + '0'.repeat(64);
        const meta = await fetchMetadata(metadataHashStr);

        const stakingFactoryAddress = (STAKING_FACTORY.addresses as Record<number, Address>)[
          chainId
        ];
        let instanceParams: GovernContractCacheInstanceParams | null = null;
        if (stakingFactoryAddress) {
          const instanceParamsRes = await client
            .readContract({
              address: stakingFactoryAddress,
              abi: STAKING_FACTORY.abi,
              functionName: 'mapInstanceParams',
              args: [address],
            })
            .catch(() => null);
          if (instanceParamsRes) {
            const [implementation, deployer, isEnabled] = instanceParamsRes as [
              Address,
              Address,
              boolean,
            ];
            instanceParams = {
              implementation: implementation ?? '',
              deployer: deployer ?? '',
              isEnabled: isEnabled ?? false,
            };
          }
        }

        const rawAgentIds = settled(agentIdsRes, [] as bigint[]) as bigint[];
        const agentIds = Array.isArray(rawAgentIds)
          ? rawAgentIds.map((id) => id.toString())
          : [];

        const payload: GovernContractCacheData = {
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
            configHash: typeof settled(configHashRes, null) === 'string'
              ? (settled(configHashRes, '') as string)
              : '',
            proxyHash: typeof settled(proxyHashRes, null) === 'string'
              ? (settled(proxyHashRes, '') as string)
              : '',
            activityChecker: typeof settled(activityCheckerRes, null) === 'string'
              ? (settled(activityCheckerRes, '') as string)
              : '',
          },
          instanceParams,
        };

        await setContractCache(chainId, address, payload);
        written += 1;
      } catch (err) {
        console.warn(`Backfill failed for ${chainId}/${address}:`, err);
        failed += 1;
      }
    }

    return res.status(200).json({
      ok: true,
      total: filtered.length,
      written,
      skipped,
      failed,
    });
  } catch (error) {
    console.error('Backfill contract cache error:', error);
    return res.status(500).json({ error: 'Backfill failed' });
  }
}
