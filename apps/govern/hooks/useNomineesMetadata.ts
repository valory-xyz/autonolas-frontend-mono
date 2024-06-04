import { useReadContracts } from 'wagmi';

import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { Abi } from 'viem';
import { useCallback, useEffect, useState } from 'react';

// TODO: move to constants
export const HASH_PREFIX = 'f01701220';
export const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

export const useNomineesMetadata = (
  nominees: { account: `0x${string}`; chainId: number }[] | undefined
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState([])

  const contracts = nominees?.map((nominee) => ({
    // TODO: replace this gracefully 
    address: nominee.account.replace('000000000000000000000000', '') as `0x${string}`,
    abi: STAKING_TOKEN.abi as Abi,
    functionName: 'metadataHash',
    chainId: Number(nominee.chainId),
  }));

  const { data, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: nominees && nominees.length > 0,
      // TODO: move to global config?
      staleTime: Infinity,
    },
  });

  const getMetadata = useCallback(async () => {
    if (!data) return [];
    
    setIsLoading(true);

    // TODO: resolve types
    const hashes = data.filter(item => item.status === 'success').map(item => (item.result as string).replace('0x', HASH_PREFIX));
    // TBD
  }, [data])

  useEffect(() => {
    
    console.log('data', data, 'isFetching', isFetching)
    if (data && !isFetching && metadata.length === 0 && !isLoading) {
      getMetadata().then(res => console.log('res', res.map(item => item.json())))
    }
  }, [data, isFetching, metadata.length, isLoading, getMetadata])

  console.log('metadataHashes', data)

  return { data, isFetching };
};
