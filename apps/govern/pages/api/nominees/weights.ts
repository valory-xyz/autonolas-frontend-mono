import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Address, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { fetchNominees } from 'libs/common-contract-functions/src';
import { RPC_URLS } from 'libs/util-constants/src';
import { TOKENOMICS, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { WEEK_IN_SECONDS } from 'common-util/constants/time';
import type { Weight } from 'types';

type WeightsResponse = Record<string, { current: Weight; next: Weight }>;

function getMainnetClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(RPC_URLS[1]),
  });
}

const voteWeightingAddress = (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id];

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
 * GET /api/nominees/weights
 *
 * Returns pre-computed nominee weights (current and next week) for all nominees.
 * Cached at the edge for 5 minutes — weights only change at weekly boundaries.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  try {
    const client = getMainnetClient();

    const [nominees, timeSumRaw, projectedInflation] = await Promise.all([
      fetchNominees(),
      client.readContract({
        address: voteWeightingAddress,
        abi: VOTE_WEIGHTING.abi,
        functionName: 'timeSum',
      }),
      fetchProjectedInflation(client),
    ]);

    if (!projectedInflation) {
      return res.status(500).json({ error: 'Failed to fetch projected inflation' });
    }

    const timeSum = Number(timeSumRaw);
    const currentTimestamp = timeSum * 1000 > Date.now() ? timeSum - WEEK_IN_SECONDS : timeSum;
    const nextTimestamp = timeSum;

    // Fetch current and next weights in parallel
    const [currentResults, nextResults] = await Promise.all([
      Promise.allSettled(
        nominees.map((n) =>
          client.readContract({
            address: voteWeightingAddress,
            abi: VOTE_WEIGHTING.abi,
            functionName: 'nomineeRelativeWeightWrite',
            args: [n.account, n.chainId, BigInt(currentTimestamp)],
          }),
        ),
      ),
      Promise.allSettled(
        nominees.map((n) =>
          client.readContract({
            address: voteWeightingAddress,
            abi: VOTE_WEIGHTING.abi,
            functionName: 'nomineeRelativeWeightWrite',
            args: [n.account, n.chainId, BigInt(nextTimestamp)],
          }),
        ),
      ),
    ]);

    const weights: WeightsResponse = {};

    nominees.forEach((nominee, index) => {
      const toWeight = (result: PromiseSettledResult<unknown>): Weight => {
        if (result.status !== 'fulfilled' || !result.value) {
          return { percentage: 0, value: 0 };
        }
        const [weight, totalSum] = result.value as [bigint, bigint];
        const totalSumMultiplier = projectedInflation < totalSum ? projectedInflation : totalSum;
        return {
          percentage: Number(ethers.formatUnits(weight, 16)),
          value:
            Number(ethers.formatUnits(weight, 18)) *
            Number(ethers.formatUnits(totalSumMultiplier, 18)),
        };
      };

      weights[nominee.account] = {
        current: toWeight(currentResults[index]),
        next: toWeight(nextResults[index]),
      };
    });

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(weights);
  } catch (error) {
    console.error('Weights API error:', error);
    return res.status(500).json({ error: 'Failed to fetch weights' });
  }
}
