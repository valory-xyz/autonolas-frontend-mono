import type { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http, type Address, zeroAddress } from 'viem';
import { mainnet } from 'viem/chains';

import {
  BLACKLISTED_STAKING_ADDRESSES,
  GATEWAY_URL,
  HASH_PREFIX,
  RPC_URLS,
} from 'libs/util-constants/src';
import { STAKING_TOKEN, VOTE_WEIGHTING } from 'libs/util-contracts/src';
import {
  areAddressesEqual,
  getAddressFromBytes32,
  getBytes32FromAddress,
} from 'libs/util-functions/src';

import { setContractCache } from 'common-util/blob';
import type { ContractCacheData } from 'types';

const IPFS_FETCH_TIMEOUT_MS = 5000;

function getMainnetClient() {
  const rpc = RPC_URLS[mainnet.id];
  if (!rpc) throw new Error('Mainnet RPC not configured');
  return createPublicClient({
    chain: mainnet,
    transport: http(rpc),
  });
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
    let failed = 0;

    for (const nominee of filtered) {
      const chainId = Number(nominee.chainId);
      const address = getAddressFromBytes32(nominee.account);
      const client = getChainClient(chainId);
      if (!client) {
        failed += 1;
        continue;
      }

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

        const payload: ContractCacheData = {
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
      failed,
    });
  } catch (error) {
    console.error('Backfill contract cache error:', error);
    return res.status(500).json({ error: 'Backfill failed' });
  }
}
