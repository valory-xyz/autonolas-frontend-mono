import { isNumber } from 'lodash';
import { Address, formatEther } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { TokenomicsUnitTypes } from 'libs/util-constants/src';

const rewardsFormatter = (value: bigint, dp: number = 4) =>
  parseFloat(formatEther(value)).toLocaleString('en', {
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  });

export const useClaimableIncentives = (
  // TODO: figure out how to import TOKENOMICS from util-contracts
  contractAddress: Address,
  contractAbi: readonly unknown[],
  ownerAddress: Address,
  id: string,
  tokenomicsUnitType?: TokenomicsUnitTypes,
) => {
  const { isFetching, data, refetch } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getOwnerIncentives',
    chainId: mainnet.id,
    args: [ownerAddress, [BigInt(tokenomicsUnitType || '0')], [BigInt(id)]],
    query: {
      enabled: !!ownerAddress && !!id && isNumber(tokenomicsUnitType),
      select: (data) => {
        const [reward, topup] = data as [bigint, bigint];
        return { reward: rewardsFormatter(reward, 4), topUp: rewardsFormatter(topup, 2) };
      },
      refetchOnWindowFocus: false,
    },
  });

  return { isFetching, refetch, ...data };
};
