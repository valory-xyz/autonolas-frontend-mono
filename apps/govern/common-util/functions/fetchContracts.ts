import { ethers } from 'ethers';
import { Address, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { RPC_URLS } from 'libs/util-constants/src';
import { TOKENOMICS, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getAddressFromBytes32 } from 'libs/util-functions/src';
import { fetchNominees, Nominee } from 'libs/common-contract-functions/src';

import { getContractCache, setContractCache } from 'common-util/blob';
import { fetchContractCacheDataFromChain } from 'common-util/fetch-contract-cache-data';
import { WEEK_IN_SECONDS } from 'common-util/constants/time';
import { Metadata, StakingContract, Weight } from 'types';

const voteWeightingAddress = (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id];

function getMainnetClient() {
  return createPublicClient({
    chain: mainnet,
    // One `nomineeRelativeWeightWrite` eth_call per nominee, twice over (current and next
    // week), is ~100 round trips against a single RPC — enough on its own to blow the ISR
    // budget. Multicall aggregates them into a handful of calls; `batch` coalesces whatever
    // is left into single JSON-RPC requests. The client path already batches via wagmi.
    batch: { multicall: true },
    transport: http(RPC_URLS[1], { batch: true }),
  });
}

/**
 * Fetches projected staking inflation from the Tokenomics contract.
 */
async function fetchProjectedInflation(
  client: ReturnType<typeof getMainnetClient>,
): Promise<bigint | null> {
  const contractArgs = {
    address: TOKENOMICS.addresses[1] as Address,
    abi: TOKENOMICS.abi,
  } as const;

  const [epochCounterRaw, epochLenRaw, inflationPerSecondRaw] = await Promise.all([
    client.readContract({ ...contractArgs, functionName: 'epochCounter' }),
    client.readContract({ ...contractArgs, functionName: 'epochLen' }),
    client.readContract({ ...contractArgs, functionName: 'inflationPerSecond' }),
  ]);

  const stakingPoint = await client.readContract({
    ...contractArgs,
    functionName: 'mapEpochStakingPoints',
    args: [BigInt(epochCounterRaw)],
  });

  const [stakingIncentive, , , stakingFraction] = stakingPoint;

  return (
    BigInt(stakingIncentive) +
    (BigInt(epochLenRaw) * BigInt(inflationPerSecondRaw) * BigInt(stakingFraction)) / BigInt(100)
  );
}

/**
 * Fetches relative weights for nominees at a given timestamp.
 */
async function fetchWeights(
  client: ReturnType<typeof getMainnetClient>,
  nominees: Nominee[],
  timestamp: number,
  projectedInflation: bigint,
): Promise<Record<Address, Weight>> {
  const results = await Promise.allSettled(
    nominees.map((nominee) =>
      client.readContract({
        address: voteWeightingAddress,
        abi: VOTE_WEIGHTING.abi,
        functionName: 'nomineeRelativeWeightWrite',
        args: [nominee.account, nominee.chainId, BigInt(timestamp)],
      }),
    ),
  );

  const weights: Record<Address, Weight> = {};
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const [weight, totalSum] = result.value as [bigint, bigint];
      const totalSumMultiplier = projectedInflation < totalSum ? projectedInflation : totalSum;

      weights[nominees[index].account] = {
        percentage: Number(ethers.formatUnits(weight, 16)),
        value:
          Number(ethers.formatUnits(weight, 18)) *
          Number(ethers.formatUnits(totalSumMultiplier, 18)),
      };
    }
  });

  return weights;
}

/** Concurrency limit for cache-miss fetches, matching `/api/contracts/batch`. */
const CACHE_MISS_CONCURRENCY = 5;

/** Runs `fn` over `items` with bounded concurrency. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

const EMPTY_METADATA: Metadata = { name: '', description: '' };

/**
 * Fetches metadata for nominees, reading the blob cache first and writing through on a miss —
 * the same two-phase path as `/api/contracts/batch`.
 *
 * Resolving every nominee straight from chain + IPFS instead took ~70 s for the full list, which
 * is longer than an ISR regeneration can run. On a warm cache this is a set of blob reads.
 */
async function fetchMetadataForNominees(nominees: Nominee[]): Promise<Record<string, Metadata>> {
  const metadataMap: Record<string, Metadata> = {};

  // Phase 1: blob cache
  const cacheResults = await Promise.allSettled(
    nominees.map(async (nominee) => {
      const address = getAddressFromBytes32(nominee.account);
      const chainId = Number(nominee.chainId);
      const snapshot = await getContractCache(chainId, address);
      return { nominee, address, chainId, snapshot };
    }),
  );

  const misses: { nominee: Nominee; address: string; chainId: number }[] = [];
  for (const result of cacheResults) {
    if (result.status !== 'fulfilled') continue;
    const { nominee, address, chainId, snapshot } = result.value;
    if (snapshot) {
      metadataMap[nominee.account] = snapshot.data.metadata ?? EMPTY_METADATA;
    } else {
      misses.push({ nominee, address, chainId });
    }
  }

  // Phase 2: chain + IPFS for the misses, then write through so the next render is warm
  await mapWithConcurrency(
    misses,
    CACHE_MISS_CONCURRENCY,
    async ({ nominee, address, chainId }) => {
      let data = null;
      try {
        data = await fetchContractCacheDataFromChain(chainId, address);
      } catch (error) {
        console.error(`Metadata fetch failed for ${chainId}:${address}`, error);
      }
      metadataMap[nominee.account] = data?.metadata ?? EMPTY_METADATA;

      // Warming the cache is best-effort and must not affect what we just read:
      // `setContractCache` rethrows on failure, so sharing a try block with the fetch above
      // would let a failed blob write discard metadata we had already resolved. Skip entirely
      // without a token — a build environment with none would log one error per contract.
      if (!data || !process.env.GOVERN_BLOB_READ_WRITE_TOKEN) return;
      try {
        await setContractCache(chainId, address, data);
      } catch (error) {
        console.warn(`Contract cache warm failed for ${chainId}:${address}`, error);
      }
    },
  );

  return metadataMap;
}

/**
 * Fetches all govern staking contracts with weights and metadata.
 * Used by the `/contracts` ISR render (`getStaticProps`), so the table ships as HTML.
 */
export async function fetchGovernContracts(): Promise<StakingContract[]> {
  const client = getMainnetClient();

  // Fetch nominees and timeSum in parallel
  const [nominees, timeSumRaw] = await Promise.all([
    fetchNominees(),
    client.readContract({
      address: voteWeightingAddress,
      abi: VOTE_WEIGHTING.abi,
      functionName: 'timeSum',
    }),
  ]);

  const timeSum = Number(timeSumRaw);
  const currentWeightTimestamp = timeSum * 1000 > Date.now() ? timeSum - WEEK_IN_SECONDS : timeSum;
  const nextWeightTimestamp = timeSum;

  // Fetch projected inflation, weights, and metadata in parallel
  const [projectedInflation, metadataMap] = await Promise.all([
    fetchProjectedInflation(client),
    fetchMetadataForNominees(nominees),
  ]);

  if (!projectedInflation) {
    return [];
  }

  const [currentWeights, nextWeights] = await Promise.all([
    fetchWeights(client, nominees, currentWeightTimestamp, projectedInflation),
    fetchWeights(client, nominees, nextWeightTimestamp, projectedInflation),
  ]);

  return nominees.map((nominee) => ({
    address: nominee.account,
    chainId: Number(nominee.chainId),
    metadata: metadataMap[nominee.account] ?? { name: '', description: '' },
    currentWeight: currentWeights[nominee.account] ?? { percentage: 0, value: 0 },
    nextWeight: nextWeights[nominee.account] ?? { percentage: 0, value: 0 },
  }));
}
