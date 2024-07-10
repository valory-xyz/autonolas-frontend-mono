import { isNumber } from 'lodash';
import { Address, formatEther } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

// TODO: figure out how to import TOKENOMICS from util-contracts
// import { TOKENOMICS } from '@autonolas-frontend-mono/util-contracts';
import { TOKENOMICS } from './tokenomics';

const rewardsFormatter = (value: bigint, dp: number = 4) =>
  parseFloat(formatEther(value)).toLocaleString('en', {
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  });

export const useClaimableIncentives = (
  ownerAddress: string,
  id: string,
  tokenomicsUnitType?: 0 | 1,
) => {
  const { data, isFetching } = useReadContract({
    address: TOKENOMICS.addresses[mainnet.id] as Address,
    abi: TOKENOMICS.abi,
    functionName: 'getOwnerIncentives',
    chainId: mainnet.id,
    args: [ownerAddress, [tokenomicsUnitType], [id]],
    query: {
      enabled: !!ownerAddress && !!id && isNumber(tokenomicsUnitType),
      select: (data) => {
        const [reward, topup] = data as [bigint, bigint];
        return { reward: rewardsFormatter(reward, 4), topUp: rewardsFormatter(topup, 2) };
      },
      refetchOnWindowFocus: false,
    },
  });

  return { isFetching, ...data };
};
