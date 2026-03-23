import { ethers } from 'ethers';
import { Address, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { VOTE_WEIGHTING } from 'libs/util-contracts/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { RPC_URLS } from 'libs/util-constants/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { BLACKLISTED_STAKING_ADDRESSES } from 'libs/util-constants/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { areAddressesEqual, getBytes32FromAddress } from 'libs/util-functions/src';

export type Nominee = {
  account: Address;
  chainId: bigint;
};

/**
 * Fetches all nominees from the VOTE_WEIGHTING contract using viem.
 * Can be used in getServerSideProps.
 * Filters out the zero address and blacklisted addresses.
 */
export async function fetchNominees(): Promise<Nominee[]> {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URLS[1]),
  });

  const allNominees = (await client.readContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi,
    functionName: 'getAllNominees',
  })) as Nominee[];

  // Filter out zero address and blacklisted addresses
  const zeroAddressBytes32 = getBytes32FromAddress(ethers.ZeroAddress);

  return allNominees.filter((item) => {
    if (item.account === zeroAddressBytes32) return false;

    const isBlacklisted = BLACKLISTED_STAKING_ADDRESSES.some((addr) =>
      areAddressesEqual(item.account, getBytes32FromAddress(addr)),
    );
    return !isBlacklisted;
  });
}
