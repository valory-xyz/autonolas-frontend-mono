import { useEffect, useState } from 'react';
import { Abi, Address, parseAbiItem } from 'viem';
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

const getMetadata = async (tokenUri: undefined | null | string) => {
  if (!tokenUri) return null;

  try {
    const uri = `${HASH_PREFIX}${tokenUri.substring(2)}`;
    const ipfsUrl = `${GATEWAY_URL}${uri}`;
    const response = await fetch(ipfsUrl);
    const json = await response.json();
    return json;
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
  const { chainId } = useAccount();
  const [metadata, setMetadata] = useState<(Metadata | null)[]>([]);

  const contracts = addresses.map((address) => ({
    address,
    abi: STAKING_TOKEN.abi as Abi,
    chainId,
    functionName: 'metadataHash',
  }));

  const { data } = useReadContracts({
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

  return metadata;
};

const useGetInstanceAddresses = () => {
  const client = usePublicClient();
  const { networkId } = useAppSelector((state) => state.network);

  const [instanceAddresses, setInstanceAddresses] = useState<Address[]>([]);

  const currentNetworkId = networkId as ChainId;

  useEffect(() => {
    (async () => {
      if (!currentNetworkId) return;
      if (!client) return;

      try {
        const eventLogs = await client.getLogs({
          address: STAKING_FACTORY.addresses[`${currentNetworkId}`] as Address,
          event: parseAbiItem(
            'event InstanceCreated(address indexed, address indexed, address indexed)',
          ),
          fromBlock: BigInt(blockNumbers[currentNetworkId]),
          toBlock: 'latest',
        });

        // log.args[1] = instance address
        const addresses = eventLogs.map((log) => log.args[1] as Address);
        setInstanceAddresses(addresses);
      } catch (e) {
        window.console.error(e);
      }
    })();
  }, [currentNetworkId, client]);

  return instanceAddresses;
};

export const useGetMyStakingContracts = () => {
  const dispatch = useAppDispatch();
  const instanceAddresses = useGetInstanceAddresses();
  const myStakingContractsMetadata = useGetMyStakingContractsMetadata(instanceAddresses);
  const nominees = useGetAllNominees();
  const { myStakingContracts } = useAppSelector((state) => state.launch);

  const instanceAddressesInBytes32 = instanceAddresses.map((address) =>
    getBytes32FromAddress(address),
  );

  useEffect(() => {
    if (!myStakingContractsMetadata) return;
    if (myStakingContractsMetadata.length === 0) return;
    if (!nominees) return;

    // if myStakingContracts is already set, do not update it
    if (myStakingContracts.length !== 0) return;

    const myStakingContractsList: MyStakingContract[] = myStakingContractsMetadata
      .map((metadata, index) => {
        if (!metadata) return null;

        return {
          id: instanceAddressesInBytes32[index],
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
    instanceAddressesInBytes32,
    nominees,
    myStakingContractsMetadata,
    myStakingContracts,
  ]);
};
