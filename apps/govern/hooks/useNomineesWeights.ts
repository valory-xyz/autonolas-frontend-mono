import { ethers } from 'ethers';
import { Abi } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContracts } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { Address } from 'types/index';

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
    // There may be cases where no one voted on the contract during the week,
    // meaning their weights won't be in the contract state for the provided timestamp.
    // Use nomineeRelativeWeightWrite instead of nomineeRelativeWeight for accuracy.
    functionName: 'nomineeRelativeWeightWrite',
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
