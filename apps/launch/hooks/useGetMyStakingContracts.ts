import { useEffect, useState } from 'react';
import { Abi, Address } from 'viem';
import { arbitrum, base, celo, gnosis, mainnet, optimism, polygon } from 'viem/chains';
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

const BATCH_SIZES: Record<string, number | null> = {
  [mainnet.id]: null, // No batching
  [gnosis.id]: null,
  [polygon.id]: null,
  [optimism.id]: 10000,
  [base.id]: null,
  [arbitrum.id]: null,
  [celo.id]: null,
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        const block = await client.getBlock();

        const batchSize = BATCH_SIZES[currentNetworkId];
        const fromBlock = blockNumbers[currentNetworkId]
          ? BigInt(blockNumbers[currentNetworkId])
          : undefined;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let eventLogs: any[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
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
          fromBlock,
          toBlock: block.number,
        };

        if (batchSize) {
          // Batching by blocks
          let currentFromBlock = fromBlock || BigInt(0);
          while (currentFromBlock <= block.number) {
            const currentToBlock = currentFromBlock + BigInt(batchSize) - BigInt(1);
            const logs = await client.getLogs({
              ...params,
              fromBlock: currentFromBlock,
              toBlock: currentToBlock < block.number ? currentToBlock : block.number,
            });
            eventLogs = [...eventLogs, ...logs];
            currentFromBlock = currentToBlock + BigInt(1);
            await delay(1000);
          }
        } else {
          // No batching needed
          eventLogs = await client.getLogs(params);
        }

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
