import { useEffect, useState } from 'react';
import { Abi, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useAccount, usePublicClient, useReadContract, useReadContracts } from 'wagmi';

import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';
import {
  STAKING_FACTORY,
  STAKING_TOKEN,
  VOTE_WEIGHTING,
} from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getBytes32FromAddress } from 'libs/util-functions/src';

import { ChainId, blockNumbers } from 'common-util/constants/stakingContract';
import { CONTRACT_TEMPLATES } from 'common-util/constants/stakingContract';
import { useAppDispatch, useAppSelector } from 'store/index';
import { setMyStakingContracts } from 'store/launch';
import { MyStakingContract } from 'types/index';

type Metadata = { name: string; description: string };

// Timeout for IPFS metadata fetches (10 seconds)
// This prevents the UI from hanging indefinitely when IPFS content doesn't exist
const IPFS_FETCH_TIMEOUT_MS = 10000;

const getMetadata = async (tokenUri: undefined | null | string) => {
  if (!tokenUri) return null;

  try {
    const uri = `${HASH_PREFIX}${tokenUri.substring(2)}`;
    const ipfsUrl = `${GATEWAY_URL}${uri}`;
    
    // Add timeout to prevent hanging when IPFS content doesn't exist
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IPFS_FETCH_TIMEOUT_MS);
    
    try {
      const response = await fetch(ipfsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        window.console.warn(`Failed to fetch IPFS metadata: ${response.status}`);
        return null;
      }
      
      const json = await response.json();
      return json;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if ((fetchError as Error).name === 'AbortError') {
        window.console.warn(`IPFS metadata fetch timed out after ${IPFS_FETCH_TIMEOUT_MS}ms for ${uri}`);
      } else {
        throw fetchError;
      }
    }
  } catch (e) {
    window.console.error(e);
  }

  return null;
};

const useGetAllNominees = () => {
  // it is only available on mainnet, hence hardcoded.
  const { data: nominees } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi,
    chainId: mainnet.id,
    functionName: 'getAllNominees',
    query: {
      select: (data: unknown) => data as { account: Address; chainId: bigint }[],
    },
  });

  return nominees;
};

const useGetMyStakingContractsMetadata = (addresses: Address[]) => {
  const { networkId } = useAppSelector((state) => state.network);
  const [metadata, setMetadata] = useState<(Metadata | null)[]>([]);

  const contracts = addresses.map((address) => ({
    address,
    abi: STAKING_TOKEN.abi as Abi,
    chainId: networkId as ChainId,
    functionName: 'metadataHash',
  }));

  const { data, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: addresses.length > 0,
      select: async (list) => {
        const metadataHashList = list.map(({ result }) => result as string);
        try {
          const metadataList = await Promise.allSettled<Metadata>(
            metadataHashList.map((hash) => getMetadata(hash)),
          );

          const results: (Metadata | null)[] = [];
          for (const response of metadataList) {
            if (response.status === 'fulfilled' && response.value) {
              results.push(response.value);
            } else {
              // To maintain the order of the addresses, push null.
              // Eg: if the metadata for the 2nd address is not available or failed to fetch,
              // push null at 2nd index
              results.push(null);
            }
          }

          return results;
        } catch (error) {
          window.console.error(error);
        }

        return [];
      },
    },
  });

  useEffect(() => {
    (async () => {
      if (!data) return;

      try {
        const result = await data;
        setMetadata(result);
      } catch (error) {
        window.console.error(error);
      }
    })();
  }, [data, addresses]);

  return { metadata, isFetching };
};

const useGetInstanceAddresses = () => {
  const { networkId } = useAppSelector((state) => state.network);
  const client = usePublicClient({ chainId: networkId as ChainId });
  const { address: account } = useAccount();

  const [instanceAddresses, setInstanceAddresses] = useState<Address[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const currentNetworkId = networkId as ChainId;

  useEffect(() => {
    (async () => {
      if (!currentNetworkId) return;
      if (!client) return;
      if (!account) return;

      setIsFetching(true);

      try {
        const eventLogs = await client.getLogs({
          address: STAKING_FACTORY.addresses[`${currentNetworkId}`] as Address,
          event: {
            type: 'event',
            name: 'InstanceCreated',
            inputs: [
              { type: 'address', indexed: true, name: 'sender' },
              { type: 'address', indexed: true, name: 'instance' },
              { type: 'address', indexed: true, name: 'implementation' },
            ],
          },
          args: { sender: account },
          fromBlock: blockNumbers[currentNetworkId]
            ? BigInt(blockNumbers[currentNetworkId])
            : undefined,
          toBlock: 'latest',
        });

        const addresses = eventLogs.map((log) => log.args?.instance as Address);
        setInstanceAddresses(addresses);
      } catch (e) {
        window.console.error(e);
      } finally {
        setIsFetching(false);
      }
    })();
  }, [client, currentNetworkId, account]);

  return { instanceAddresses, isFetching };
};

export const useGetMyStakingContracts = () => {
  const dispatch = useAppDispatch();
  const { instanceAddresses, isFetching: isInstancesFetching } = useGetInstanceAddresses();
  const { metadata: myStakingContractsMetadata, isFetching: isMetadataFetching } =
    useGetMyStakingContractsMetadata(instanceAddresses);
  const nominees = useGetAllNominees();

  const { networkId } = useAppSelector((state) => state.network);

  useEffect(() => {
    if (isMetadataFetching || isInstancesFetching) return;
    if (!nominees) return;

    const instanceAddressesInBytes32 = instanceAddresses.map((address) =>
      getBytes32FromAddress(address),
    );

    const myStakingContractsList: MyStakingContract[] = instanceAddresses
      .map((address, index) => {
        const metadata = myStakingContractsMetadata[index];

        if (!metadata) return null;

        return {
          id: address,
          chainId: networkId,
          name: metadata.name,
          description: metadata.description,
          template: CONTRACT_TEMPLATES[0].title,
          isNominated:
            nominees.findIndex((item) => item.account === instanceAddressesInBytes32[index]) !== -1,
        };
      })
      // filter out null values (ie. contracts without metadata - failed to fetch or not available)
      .filter((contract): contract is MyStakingContract => contract !== null);

    dispatch(setMyStakingContracts(myStakingContractsList));
  }, [
    dispatch,
    instanceAddresses,
    nominees,
    myStakingContractsMetadata,
    isMetadataFetching,
    isInstancesFetching,
    networkId,
  ]);
};
