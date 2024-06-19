import { kebabCase } from 'lodash';
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

import { SupportedChain } from 'common-util/constants/rpcs';
import { CONTRACT_TEMPLATES } from 'common-util/constants/stakingContract';
import { useAppDispatch } from 'store/index';
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
    args: [],
    query: {
      select: (data: unknown) => {
        const list = data as { account: Address; chainId: bigint }[];
        return list.filter((nominee) => nominee.chainId === BigInt(mainnet.id));
      },
    },
  });

  return nominees;
};

const useGetMyStakingContractsMetadata = (addresses: Address[]) => {
  const { chainId } = useAccount();
  const [metadata, setMetadata] = useState<Metadata[]>([]);

  const contracts = addresses.map((address) => ({
    address,
    abi: STAKING_TOKEN.abi as Abi,
    chainId,
    functionName: 'metadataHash',
    args: [],
  }));

  const { data } = useReadContracts({
    contracts,
    query: {
      enabled: addresses.length > 0,
      select: async (list) => {
        const metadataHashList = list.map(({ result }) => result as string);
        const metadataPromise = await Promise.allSettled(
          metadataHashList.map(async (hash) => await getMetadata(hash)),
        );
        const metadata: Metadata[] = metadataPromise
          .filter((item) => item.status === 'fulfilled')
          .map((item) => ({
            name: item.value['name'],
            description: item.value['description'],
          }));

        return metadata;
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
  const { chainId } = useAccount();

  const [instanceAddresses, setInstanceAddresses] = useState<Address[]>([]);

  const currentChainId = chainId as SupportedChain;

  useEffect(() => {
    (async () => {
      if (!currentChainId) return;
      if (!client) return;

      try {
        const eventLogs = await client.getLogs({
          address: STAKING_FACTORY.addresses[`${currentChainId}`] as Address,
          event: parseAbiItem(
            'event InstanceCreated(address indexed, address indexed, address indexed)',
          ),
          fromBlock: BigInt(0),
          toBlock: 'latest',
        });

        // log.args[1] is the instance address
        const addresses = eventLogs.map((log) => log.args[1] as Address);
        setInstanceAddresses(addresses);
      } catch (e) {
        window.console.error(e);
      }
    })();
  }, [currentChainId, client]);

  return instanceAddresses;
};

export const useGetMyStakingContracts = () => {
  const dispatch = useAppDispatch();
  const instanceAddresses = useGetInstanceAddresses();
  const myStakingContractsMetadata = useGetMyStakingContractsMetadata(instanceAddresses);
  const nominees = useGetAllNominees();

  const instanceAddressesInBytes32 = instanceAddresses.map((address) =>
    getBytes32FromAddress(address),
  );

  useEffect(() => {
    if (!myStakingContractsMetadata) return;
    if (myStakingContractsMetadata.length === 0) return;
    if (!nominees) return;

    const myStakingContracts: MyStakingContract[] = myStakingContractsMetadata.map((metadata) => ({
      id: kebabCase(metadata.name),
      name: metadata.name,
      description: metadata.description,
      template: CONTRACT_TEMPLATES[0].title,
      isNominated:
        nominees.some((nominee) => instanceAddressesInBytes32.includes(nominee.account)) ?? false,
    }));

    dispatch(setMyStakingContracts(myStakingContracts));
  }, [dispatch, instanceAddressesInBytes32, nominees, myStakingContractsMetadata]);
};
