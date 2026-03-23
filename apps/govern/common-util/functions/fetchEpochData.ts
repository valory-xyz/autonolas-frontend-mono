import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { TOKENOMICS } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { RPC_URLS } from 'libs/util-constants/src';

export type EpochData = {
  epochCounter: number;
  epochLength: number;
  prevEpochEndTime: number;
  nextEpochEndTime: number;
};

/**
 * Fetches epoch data from the Tokenomics contract using viem.
 * Can be used in getServerSideProps.
 */
export async function fetchEpochData(): Promise<EpochData> {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URLS[1]),
  });

  const contractConfig = {
    address: TOKENOMICS.addresses[1] as `0x${string}`,
    abi: TOKENOMICS.abi,
  } as const;

  const [epochCounterRaw, epochLenRaw] = await Promise.all([
    client.readContract({ ...contractConfig, functionName: 'epochCounter' }),
    client.readContract({ ...contractConfig, functionName: 'epochLen' }),
  ]);

  const epochCounter = Number(epochCounterRaw);
  const epochLength = Number(epochLenRaw);

  // Fetch previous epoch data to get endTime
  const prevEpochPoint = await client.readContract({
    ...contractConfig,
    functionName: 'mapEpochTokenomics',
    args: [BigInt(epochCounter - 1)],
  });

  const prevEpochEndTime = Number(prevEpochPoint.endTime);
  const nextEpochEndTime = prevEpochEndTime + epochLength;

  return {
    epochCounter,
    epochLength,
    prevEpochEndTime,
    nextEpochEndTime,
  };
}
