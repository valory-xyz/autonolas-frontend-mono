import { QueryClient } from '@tanstack/react-query';

export type StakingContractMetadata = { name: string; description: string };

/** Staking contracts `account` created on `chainId`, as found by `useGetMyStakingContracts`. */
export const myStakingContractAddressesKey = (chainId: number | undefined, account?: string) =>
  ['launch', 'myStakingContractAddresses', chainId, account?.toLowerCase()] as const;

/** IPFS metadata behind one on-chain `metadataHash` (0x-prefixed). */
export const stakingContractMetadataKey = (metadataHash: string) =>
  ['launch', 'stakingContractMetadata', metadataHash.toLowerCase()] as const;

/**
 * Stores metadata Create already knows (it just uploaded it), so the list never fetches it from
 * IPFS and keeps it once discovery returns the new contract.
 */
export const seedStakingContractMetadata = (
  queryClient: QueryClient,
  metadataHash: string,
  metadata: StakingContractMetadata,
) => {
  queryClient.setQueryData(stakingContractMetadataKey(metadataHash), metadata);
};
