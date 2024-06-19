import { ethers } from 'ethers';
import { useEffect } from 'react';
import { AbiItem, Address, parseAbiItem } from 'viem';
import { mainnet } from 'viem/chains';
import { useAccount, usePublicClient, useReadContract, useWatchContractEvent } from 'wagmi';

import {
  STAKING_FACTORY,
  STAKING_TOKEN,
  VOTE_WEIGHTING,
} from 'libs/util-contracts/src/lib/abiAndAddresses';

export const getBytes32FromAddress = (address: Address | string) => {
  return ethers.zeroPadValue(address, 32) as Address;
};

// const useGetAllNominees = () => {
//   const { chainId } = useAccount();

//   if (!chainId) return [];

//   const { data } = useReadContract({
//     address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[chainId],
//     abi: VOTE_WEIGHTING.abi,
//     chainId,
//     functionName: 'getAllNominees',
//     args: [],
//     query: {
//       select: (data) => {
//         const nominees = data as { account: Address; chainId: bigint }[];
//         const nomineesFilteredByChainId = nominees.filter(
//           (nominee) => nominee.chainId === BigInt(chainId),
//         );
//         // return { implementation, deployer, isEnabled };

//         return nomineesFilteredByChainId;
//       },
//     },
//   });

//   return data;
// };

export const useGetMyStakingContracts = () => {
  // const data = useWatchContractEvent({
  //   address: STAKING_FACTORY.addresses[1] as Address,
  //   abi: STAKING_FACTORY.abi,
  //   eventName: 'InstanceCreated',
  //   onLogs(logs) {
  //     console.log('New logs!', logs);
  //   },
  // });
  // console.log('Data:', data);
  // const { chainId } = useAccount();
  const chainId = 1;

  const client = usePublicClient();

  useEffect(() => {
    (async () => {
      if (!client) return;

      const logs = await client.getLogs({
        address: STAKING_FACTORY.addresses[1] as Address,
        event: parseAbiItem(
          'event InstanceCreated(address indexed, address indexed, address indexed)',
        ),
        fromBlock: BigInt(0),
        toBlock: 'latest',
      });

      console.log('Logs:', logs);

      const updatedLogs = logs.map((log) => {
        const convertedArgs = getBytes32FromAddress(log.args[1] as Address);
        return convertedArgs;
      });

      console.log('Updated logs:', updatedLogs);
    })();
  }, [client]);

  const { data: metadataForFirstEvent } = useReadContract({
    address: '0x7248d855a3d4d17c32Eb0D996A528f7520d2F4A3', // instances[1].address,
    abi: STAKING_TOKEN.abi,
    chainId,
    functionName: 'metadataHash',
    args: [],
    // query: {
    //   select: (data) => {
    //     const nominees = data as { account: Address; chainId: bigint }[];
    //     const nomineesFilteredByChainId = nominees.filter(
    //       (nominee) => nominee.chainId === BigInt(chainId),
    //     );
    //     // return { implementation, deployer, isEnabled };

    //     return nomineesFilteredByChainId;
    //   },
    // },
  });

  console.log('Data:', metadataForFirstEvent);

  const { data } = useReadContract({
    // it is only available on mainnet
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi,
    chainId: mainnet.id,
    functionName: 'getAllNominees',
    args: [],
    query: {
      select: (data) => {
        // const nominees = data as { account: Address; chainId: bigint }[];
        // const nomineesFilteredByChainId = nominees.filter(
        //   (nominee) => nominee.chainId === BigInt(chainId),
        // );
        // return { implementation, deployer, isEnabled };
        return data;
        // return nomineesFilteredByChainId;
      },
    },
  });

  console.log('Data:', data);
};

// export const useGetMyStakingContracts = () => {
//   const { chainId } = useAccount();

//   return
// };
