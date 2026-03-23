import { ethers } from 'ethers';
import { Address, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { RPC_URLS } from 'libs/util-constants/src';
import { TOKENOMICS, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getAddressFromBytes32 } from 'libs/util-functions/src';
import { fetchNominees, Nominee } from 'libs/common-contract-functions/src';

import { fetchContractCacheDataFromChain } from 'common-util/fetch-contract-cache-data';
import { WEEK_IN_SECONDS } from 'common-util/constants/time';
import { Metadata, StakingContract, Weight } from 'types';

const voteWeightingAddress = (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id];

function getMainnetClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(RPC_URLS[1]),
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

/**
 * Fetches metadata for nominees from cache or RPC.
 */
async function fetchMetadataForNominees(nominees: Nominee[]): Promise<Record<string, Metadata>> {
  const results = await Promise.allSettled(
    nominees.map(async (nominee) => {
      const address = getAddressFromBytes32(nominee.account);
      const chainId = Number(nominee.chainId);
      const data = await fetchContractCacheDataFromChain(chainId, address);
      return {
        account: nominee.account,
        metadata: data?.metadata ?? { name: '', description: '' },
      };
    }),
  );

  const metadataMap: Record<string, Metadata> = {};
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      metadataMap[result.value.account] = result.value.metadata;
    }
  });

  return metadataMap;
}

/**
 * Fetches all govern staking contracts with weights and metadata.
 * Can be used in getServerSide.
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
