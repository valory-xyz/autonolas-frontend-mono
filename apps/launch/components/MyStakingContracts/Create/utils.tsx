import { readContract } from '@wagmi/core';
import { Alert, notification } from 'antd';
import { ethers } from 'ethers';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';

import { CHAIN_NAMES } from 'libs/util-constants/src';
import { STAKING_FACTORY, STAKING_VERIFIER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { wagmiConfig } from 'common-util/config/wagmi';

export const WrongNetworkAlert = ({ networkId }: { networkId?: number | null }) => (
  <Alert
    className="mb-24"
    type="warning"
    showIcon
    message={`Your wallet is connected to the wrong network. Switch the wallet network to ${
      CHAIN_NAMES[networkId || mainnet.id]
    } to create a staking contract.`}
  />
);

// Checks if implementation is verified
export const checkImplementationVerified = async (chainId: number, implementation: Address) => {
  const verifierAddress = (await readContract(wagmiConfig, {
    abi: STAKING_FACTORY.abi,
    address: (STAKING_FACTORY.addresses as Record<number, Address>)[chainId],
    chainId,
    functionName: 'verifier',
  })) as Address;

  console.log('verifierAddress: ', verifierAddress);

  if (verifierAddress === ethers.ZeroAddress) return true;

  const result = await readContract(wagmiConfig, {
    abi: STAKING_VERIFIER.abi,
    address: verifierAddress,
    chainId,
    functionName: 'verifyImplementation',
    args: [implementation],
  });

  console.log('result: ', result);

  if (!result) {
    notification.error({ message: 'Selected implementation is not verified' });
  }

  return result;
};
