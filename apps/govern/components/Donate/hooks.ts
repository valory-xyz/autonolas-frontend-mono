import { ethers } from 'ethers';
import { useCallback, useMemo } from 'react';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { TOKENOMICS, TREASURY } from 'libs/util-contracts/src/lib/abiAndAddresses';

const useVeOLASThreshold = () =>
  useReadContract({
    address: TOKENOMICS.addresses[mainnet.id],
    abi: TOKENOMICS.abi,
    chainId: mainnet.id,
    functionName: 'veOLASThreshold',
    query: {
      select: (data) => ethers.formatEther(`${data}`),
    },
  });

const useMinAcceptedETH = () =>
  useReadContract({
    address: TREASURY.addresses[mainnet.id],
    abi: TREASURY.abi,
    chainId: mainnet.id,
    functionName: 'minAcceptedETH',
  });

export const useEpochCounter = () =>
  useReadContract({
    address: TOKENOMICS.addresses[mainnet.id],
    abi: TOKENOMICS.abi,
    chainId: mainnet.id,
    functionName: 'epochCounter',
  });

const useEpochTokenomics = (epochCounter: number | undefined) =>
  useReadContract({
    address: TOKENOMICS.addresses[mainnet.id],
    abi: TOKENOMICS.abi,
    chainId: mainnet.id,
    functionName: 'mapEpochTokenomics',
    args: [BigInt(epochCounter || 0)],
    query: {
      enabled: epochCounter !== undefined,
    },
  });

const useEpochLength = () =>
  useReadContract({
    address: TOKENOMICS.addresses[mainnet.id],
    abi: TOKENOMICS.abi,
    chainId: mainnet.id,
    functionName: 'epochLen',
  });

export const useThresholdData = () => {
  const {
    data: veOLASThreshold,
    isFetching: isVeOLASThresholdFetching,
    refetch: refetchVeOLASThreshold,
  } = useVeOLASThreshold();
  const {
    data: minAcceptedETH,
    isFetching: isMinAcceptedETHFetching,
    refetch: refetchMinAcceptedETH,
  } = useMinAcceptedETH();
  const {
    data: epochCounter,
    isFetching: isEpochCounterFetching,
    refetch: refetchEpochCounter,
  } = useEpochCounter();
  const {
    data: prevEpochPoint,
    isFetching: isPrevEpochPointFetching,
    refetch: refetchPrevEpochPoint,
  } = useEpochTokenomics(epochCounter !== undefined ? Number(epochCounter) - 1 : undefined);
  const {
    data: epochLength,
    isFetching: isEpochLengthFetching,
    refetch: refetchEpochLength,
  } = useEpochLength();

  const nextEpochEndTime = useMemo(() => {
    if (prevEpochPoint === undefined) return null;
    if (epochLength === undefined) return null;
    return prevEpochPoint.endTime + epochLength;
  }, [prevEpochPoint, epochLength]);

  const refetchData = useCallback(async () => {
    const promises = [
      refetchVeOLASThreshold(),
      refetchMinAcceptedETH(),
      refetchEpochCounter(),
      refetchPrevEpochPoint(),
      refetchEpochLength(),
    ];

    return Promise.all(promises);
  }, [
    refetchVeOLASThreshold,
    refetchMinAcceptedETH,
    refetchEpochCounter,
    refetchPrevEpochPoint,
    refetchEpochLength,
  ]);

  return {
    veOLASThreshold,
    minAcceptedETH: minAcceptedETH as bigint | undefined,
    epochCounter,
    prevEpochEndTime: prevEpochPoint?.endTime,
    epochLength,
    nextEpochEndTime,
    isDataLoading:
      isVeOLASThresholdFetching ||
      isMinAcceptedETHFetching ||
      isEpochCounterFetching ||
      isPrevEpochPointFetching ||
      isEpochLengthFetching,
    refetchData,
  };
};
