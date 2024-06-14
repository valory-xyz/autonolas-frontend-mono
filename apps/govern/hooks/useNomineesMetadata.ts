import { useCallback, useEffect, useState } from 'react';
import { Abi } from 'viem';
import { Address } from 'viem';
import { useReadContracts } from 'wagmi';

import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getAddressFromBytes32, getBytes32FromAddress } from 'common-util/functions';

const HASH_PREFIX = 'f01701220';
const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

const BATCH_SIZE = 10;
const CONCURRENCY_LIMIT = 5;

type HashesWithNominees = { nominee: Address; hash: string }[];
type Metadata = { name: string; description: string };

const fetchBatch = async (params: HashesWithNominees) => {
  const results = [];
  for (let i = 0; i < params.length; i += CONCURRENCY_LIMIT) {
    const batch = params.slice(i, i + CONCURRENCY_LIMIT);
    const responses = await Promise.allSettled(
      batch.map((item) => fetch(`${GATEWAY_URL}${item.hash}`)),
    );

    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value) {
        const data = await response.value.json();
        results.push(data);
      } else {
        results.push(null); // or handle error response
      }
    }
  }
  return results;
};

export const useNomineesMetadata = (nominees: { account: Address; chainId: number }[]) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contractsMetadata, setContractsMetadata] = useState<Record<string, Metadata> | null>(null);

  const contracts = nominees.map((nominee) => ({
    address: getAddressFromBytes32(nominee.account),
    abi: STAKING_TOKEN.abi as Abi,
    chainId: Number(nominee.chainId),
    functionName: 'metadataHash',
  }));

  const { data, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: nominees.length > 0,
    },
  });

  const getMetadata = useCallback(async () => {
    if (!data) return;

    setIsLoading(true);

    try {
      const hashesWithNominees = data.reduce((res: HashesWithNominees, item, index) => {
        if (item.status === 'success') {
          res.push({
            nominee: nominees[index].account,
            hash: (item.result as string).replace('0x', HASH_PREFIX),
          });
        }
        return res;
      }, []);

      const metadataResults: Record<string, Metadata> = {};
      for (let i = 0; i < hashesWithNominees.length; i += BATCH_SIZE) {
        const batch = hashesWithNominees.slice(i, i + BATCH_SIZE);
        const batchResults = await fetchBatch(batch);
        batch.forEach((item, index) => {
          if (batchResults[index]) {
            metadataResults[getBytes32FromAddress(item.nominee)] = batchResults[index];
          }
        });
      }

      setContractsMetadata(metadataResults);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setIsLoading(false);
    }
  }, [data, nominees]);

  useEffect(() => {
    if (data && !isFetching && !contractsMetadata && !isLoading) {
      getMetadata();
    }
  }, [contractsMetadata, data, getMetadata, isFetching, isLoading]);

  return { data: contractsMetadata };
};
