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

/** Request timeout in milliseconds for the ISR/SSR fetch path.
 *  10 s gives slow RPCs enough time to respond while staying well under
 *  typical serverless function limits (usually 10–60 s). */
const ISR_TIMEOUT_MS = 10_000;

/**
 * Fetches epoch data from the Tokenomics contract using viem.
 * Can be used in getStaticProps / getServerSideProps.
 */
export async function fetchEpochData(): Promise<EpochData> {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URLS[1], { timeout: ISR_TIMEOUT_MS }),
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
