import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
import { base16 } from 'multiformats/bases/base16';

import { HASH_PREFIX } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';

import {
  ACTIVITY_CHECKER_ADDRESSES,
  CONTRACT_COMMON_VALUES,
  ChainId,
  SERVICE_REGISTRY_ADDRESSES,
  SERVICE_REGISTRY_TOKEN_UTILITY_ADDRESSES,
  STAKING_TOKEN_ADDRESSES,
  isSupportedChainId,
} from 'common-util/constants/stakingContract';

type StakingContractValues = {
  metadataHash: string;
  maxNumServices: number;
  rewardsPerSecond: number;
  chainId: ChainId;
};
export const getStakingContractInitPayload = ({
  metadataHash,
  maxNumServices,
  rewardsPerSecond,
  chainId,
}: StakingContractValues) => {
  const stakingParams = {
    metadataHash,
    maxNumServices,
    rewardsPerSecond: ethers.parseUnits(`${rewardsPerSecond}`, 18),
    ...CONTRACT_COMMON_VALUES,
    serviceRegistry: SERVICE_REGISTRY_ADDRESSES[chainId],
    activityChecker: ACTIVITY_CHECKER_ADDRESSES[chainId],
  };

  const contractInterface = new ethers.Interface(STAKING_TOKEN.abi);
  const serviceRegistryTokenUtilityAddress = SERVICE_REGISTRY_TOKEN_UTILITY_ADDRESSES[chainId];
  const tokenAddress = STAKING_TOKEN_ADDRESSES[chainId];

  const encodedPayload = contractInterface.encodeFunctionData('initialize', [
    stakingParams,
    serviceRegistryTokenUtilityAddress,
    tokenAddress,
  ]);

  return encodedPayload;
};

const ipfs = create({
  host: process.env.NEXT_PUBLIC_REGISTRY_URL,
  port: 443,
  protocol: 'https',
});

// TODO: move to shared libs?
export const getIpfsHash = async ({ name, description }: { name: string; description: string }) => {
  const response = await ipfs.add({ content: JSON.stringify({ name, description }) });
  const hash = response.cid.toV1().toString(base16.encoder);
  const updatedHash = hash.replace(HASH_PREFIX, '0x');

  return updatedHash;
};
