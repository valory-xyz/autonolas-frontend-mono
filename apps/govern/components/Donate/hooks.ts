import { ethers } from 'ethers';
import { useCallback, useMemo } from 'react';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';

import { TOKENOMICS, TREASURY } from 'libs/util-contracts/src/lib/abiAndAddresses';

const TOKENOMICS_CONTRACT = {
  address: TOKENOMICS.addresses[mainnet.id],
  abi: TOKENOMICS.abi,
  chainId: mainnet.id,
} as const;

export const useEpochCounter = () =>
  useReadContract({
    ...TOKENOMICS_CONTRACT,
    functionName: 'epochCounter',
  });

export const useEpochTokenomics = (epochCounter: number | undefined | null) =>
  useReadContract({
    ...TOKENOMICS_CONTRACT,
    functionName: 'mapEpochTokenomics',
    args: epochCounter ? [BigInt(epochCounter)] : undefined,
    query: {
      enabled: !!epochCounter,
    },
  });

/**
 * Batches veOLASThreshold, minAcceptedETH, epochCounter, and epochLen
 * into a single multicall RPC request (4 reads → 1 call).
 */
const useThresholdBatch = () => {
  const { data, isFetching, refetch } = useReadContracts({
    contracts: [
      { ...TOKENOMICS_CONTRACT, functionName: 'veOLASThreshold' },
      {
        address: TREASURY.addresses[mainnet.id],
        abi: TREASURY.abi,
        chainId: mainnet.id,
        functionName: 'minAcceptedETH',
      },
      { ...TOKENOMICS_CONTRACT, functionName: 'epochCounter' },
      { ...TOKENOMICS_CONTRACT, functionName: 'epochLen' },
    ],
  });

  const veOLASThreshold = useMemo(() => {
    const raw = data?.[0];
    if (raw?.status !== 'success' || raw.result === undefined) return undefined;
    return ethers.formatEther(`${raw.result}`);
  }, [data]);

  const minAcceptedETH = useMemo(() => {
    const raw = data?.[1];
    if (raw?.status !== 'success') return undefined;
    return BigInt(raw.result as string | number);
  }, [data]);

  const epochCounter = useMemo(() => {
    const raw = data?.[2];
    if (raw?.status !== 'success') return undefined;
    return BigInt(raw.result as string | number);
  }, [data]);

  const epochLength = useMemo(() => {
    const raw = data?.[3];
    if (raw?.status !== 'success') return undefined;
    return BigInt(raw.result as string | number);
  }, [data]);

  return { veOLASThreshold, minAcceptedETH, epochCounter, epochLength, isFetching, refetch };
};

export const useThresholdData = () => {
  const {
    veOLASThreshold,
    minAcceptedETH,
    epochCounter,
    epochLength,
    isFetching: isBatchFetching,
    refetch: refetchBatch,
  } = useThresholdBatch();

  const {
    data: prevEpochPoint,
    isFetching: isPrevEpochPointFetching,
    refetch: refetchPrevEpochPoint,
  } = useEpochTokenomics(epochCounter !== undefined ? Number(epochCounter) - 1 : undefined);

  const nextEpochEndTime = useMemo(() => {
    if (prevEpochPoint === undefined) return null;
    if (epochLength === undefined) return null;
    return prevEpochPoint.endTime + Number(epochLength);
  }, [prevEpochPoint, epochLength]);

  const refetchData = useCallback(async () => {
    return Promise.all([refetchBatch(), refetchPrevEpochPoint()]);
  }, [refetchBatch, refetchPrevEpochPoint]);

  return {
    veOLASThreshold,
    minAcceptedETH,
    epochCounter: epochCounter !== undefined ? Number(epochCounter) : undefined,
    prevEpochEndTime: prevEpochPoint?.endTime,
    epochLength: epochLength !== undefined ? Number(epochLength) : undefined,
    nextEpochEndTime,
    isDataLoading: isBatchFetching || isPrevEpochPointFetching,
    refetchData,
  };
};
