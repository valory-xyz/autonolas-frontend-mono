import { Abi, Address } from 'viem';
import { mainnet } from 'viem/chains';

import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { isL1Network } from 'libs/util-functions/src';

import {
  AGENT_REGISTRY_CONTRACT,
  COMPONENT_REGISTRY_CONTRACT,
  GENERIC_ERC20_CONTRACT,
  OPERATOR_WHITELIST_CONTRACT,
  REGISTRIES_MANAGER_CONTRACT,
  SERVICE_MANAGER_CONTRACT,
  SERVICE_MANAGER_TOKEN_CONTRACT,
  SERVICE_REGISTRY_CONTRACT,
  SERVICE_REGISTRY_L2,
  SERVICE_REGISTRY_TOKEN_UTILITY_CONTRACT,
} from 'common-util/AbiAndAddresses';
import { doesNetworkHaveValidServiceManagerTokenFn } from 'common-util/functions';

import { ADDRESSES } from './addresses';
import { getServiceManagerAddress } from './index';

// chainId is widened to `number` so wagmi's simulate/write/wait overloads accept
// it against the workspace's non-const chains tuple. ABIs are cast to `Abi`
// because the source modules use plain `export const` without `as const`, so
// viem can't infer return types — manual casts on the call site stay.
//
// TODO(libs/util-contracts): convert the ABI modules in libs/util-contracts and
// common-util/AbiAndAddresses to declare each export with `as const`. Once that
// lands, the `as Abi` casts here (and the `as Promise<bigint>` / `as { token:
// string }` etc. casts at each call site) can be removed and viem will infer
// return shapes from the literal ABI — same payoff seen in the launch/build/
// govern/contribute migrations where the ABIs were already `as const`.

type Params = { address: Address; abi: Abi; chainId: number };

const chainAddresses = (chainId: number) => {
  const addresses = (ADDRESSES as Record<number, Record<string, string>>)[chainId];
  if (!addresses) throw new Error(`No contract addresses found for chainId ${chainId}`);
  return addresses;
};

export const componentRegistryParams = (chainId: number): Params => ({
  address: chainAddresses(chainId).componentRegistry as Address,
  abi: COMPONENT_REGISTRY_CONTRACT.abi as Abi,
  chainId: Number(chainId),
});

export const agentRegistryParams = (chainId: number): Params => ({
  address: chainAddresses(chainId).agentRegistry as Address,
  abi: AGENT_REGISTRY_CONTRACT.abi as Abi,
  chainId: Number(chainId),
});

export const mechMinterParams = (chainId: number): Params => ({
  address: chainAddresses(chainId).registriesManager as Address,
  abi: REGISTRIES_MANAGER_CONTRACT.abi as Abi,
  chainId: Number(chainId),
});

export const serviceRegistryParams = (chainId: number): Params => {
  const addresses = chainAddresses(chainId);
  return isL1Network(chainId)
    ? {
        address: addresses.serviceRegistry as Address,
        abi: SERVICE_REGISTRY_CONTRACT.abi as Abi,
        chainId: Number(chainId),
      }
    : {
        address: addresses.serviceRegistryL2 as Address,
        abi: SERVICE_REGISTRY_L2.abi as Abi,
        chainId: Number(chainId),
      };
};

/**
 * Returns the service manager params. For chains with the token-utility variant,
 * the proxy address is resolved at runtime via the registry's `manager()` call.
 */
export const serviceManagerParams = async (chainId: number): Promise<Params> => {
  const addresses = chainAddresses(chainId);
  if (doesNetworkHaveValidServiceManagerTokenFn(chainId)) {
    const proxyAddress = (await getServiceManagerAddress()) as Address;
    return {
      address: proxyAddress,
      abi: SERVICE_MANAGER_TOKEN_CONTRACT.abi as Abi,
      chainId: Number(chainId),
    };
  }
  return {
    address: addresses.serviceManager as Address,
    abi: SERVICE_MANAGER_CONTRACT.abi as Abi,
    chainId: Number(chainId),
  };
};

export const serviceRegistryTokenUtilityParams = (chainId: number): Params => ({
  address: chainAddresses(chainId).serviceRegistryTokenUtility as Address,
  abi: SERVICE_REGISTRY_TOKEN_UTILITY_CONTRACT.abi as Abi,
  chainId: Number(chainId),
});

export const operatorWhitelistParams = (chainId: number): Params => ({
  address: chainAddresses(chainId).operatorWhitelist as Address,
  abi: OPERATOR_WHITELIST_CONTRACT.abi as Abi,
  chainId: Number(chainId),
});

export const genericErc20Params = (tokenAddress: Address, chainId: number): Params => ({
  address: tokenAddress,
  abi: GENERIC_ERC20_CONTRACT.abi as Abi,
  chainId: Number(chainId),
});

export const dispenserParams: Params = {
  address: DISPENSER.addresses[mainnet.id] as Address,
  abi: DISPENSER.abi as Abi,
  chainId: mainnet.id as number,
};
