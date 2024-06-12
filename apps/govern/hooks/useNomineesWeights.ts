import { ethers } from 'ethers';
import { Address } from 'types/index';
import { Abi } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContracts } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

type Weight = { percentage: number; value: number };

export const useNomineesWeights = (
  nominees: { account: Address; chainId: number }[],
  timestamp: number | null,
  scopeKey?: string,
) => {
  const contracts = nominees.map((nominee) => ({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    functionName: 'nomineeRelativeWeight',
    args: [nominee.account, nominee.chainId, timestamp],
  }));

  const { data } = useReadContracts({
    contracts,
    scopeKey,
    query: {
      enabled: nominees.length > 0 && timestamp !== null,
      select: (data) => {
        return data.reduce((res: Record<Address, Weight>, item, index) => {
          if (item.status === 'success' && item.result) {
            const [weight, totalSum] = item.result as number[];
            res[nominees[index].account] = {
              percentage: Number(ethers.formatUnits(weight, 16)),
              value:
                Number(ethers.formatUnits(weight, 18)) * Number(ethers.formatUnits(totalSum, 18)),
            };
          }
          return res;
        }, {});
      },
    },
  });

  return { data };
};
