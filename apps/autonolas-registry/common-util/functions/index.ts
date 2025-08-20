import { PublicKey } from '@solana/web3.js';
import { RuleObject } from 'antd/es/form';
import { StoreValue } from 'antd/es/form/interface';
import { Contract, FallbackProvider, JsonRpcProvider, ethers } from 'ethers';
import { Contract as ContractV5 } from 'ethers-v5';
import { isString } from 'lodash';
import { Address } from 'viem';

import {
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  isValidAddress,
  notifyError,
  notifyWarning,
  sendTransaction as sendTransactionLegacyFn,
} from '@autonolas/frontend-library';

import { sendTransaction as sendTransactionFn } from 'libs/util-functions/src';
import { RpcUrl } from 'libs/util-functions/src/lib/sendTransaction/types';

import { VM_TYPE } from '../../util/constants';
import { RPC_URLS } from '../Contracts';
import { SUPPORTED_CHAINS } from '../Login';
import { EVM_SUPPORTED_CHAINS, SVM_SUPPORTED_CHAINS, SolanaChain } from '../Login/config';

// TODO: provide types for MODAL_PROVIDER
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getModalProvider = () => (window as any)?.MODAL_PROVIDER;

// TODO: provide types for ethereum
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getWindowEthereum = () => (window as any)?.ethereum;

export const getChainId = (chainId = null) => {
  if (chainId) return chainId;

  // chainId fetched from sessionStorage
  const chainIdFromSessionStorage =
    typeof sessionStorage === 'undefined' ? 1 : Number(sessionStorage.getItem('chainId'));

  // if chainId is not supported, throw error
  if (!EVM_SUPPORTED_CHAINS.find((e) => e.id === chainIdFromSessionStorage)) {
    return new Error('Invalid chain id');
  }

  return chainIdFromSessionStorage || 1;
};

export const getProvider = () => {
  const defaultChainId = getChainId();
  const rpcUrl = typeof defaultChainId === 'number' ? (RPC_URLS as RpcUrl)[defaultChainId] : null;

  if (!rpcUrl) {
    throw new Error(`No RPC URL found for chainId: ${defaultChainId}`);
  }

  if (typeof window === 'undefined') {
    /* eslint-disable-next-line no-console */
    console.warn('No provider found, fetching RPC URL from first supported chain');
    return rpcUrl;
  }

  // connected via wallet-connect
  const walletProvider = getModalProvider();
  if (walletProvider) {
    const walletConnectChainId = Number(walletProvider.chainId);

    // if logged in via wallet-connect but chainId is not supported,
    // default to mainnet (ie. Use JSON-RPC provider)
    return walletConnectChainId === defaultChainId ? walletProvider : rpcUrl;
  }

  // NOT logged in but has wallet installed (eg. Metamask).
  // If chainId is not supported, default to mainnet (ie. Use JSON-RPC provider)
  const windowEthereum = getWindowEthereum();
  if (windowEthereum?.chainId) {
    const walletChainId = Number(windowEthereum.chainId);

    return walletChainId === defaultChainId ? windowEthereum : rpcUrl;
  }

  // fallback to mainnet JSON RPC provider
  return rpcUrl;
};

export const getEthersProvider = () => {
  const provider = getProvider();

  // if provider is a string, it is a JSON-RPC provider
  if (typeof provider === 'string') {
    return new ethers.JsonRpcProvider(provider);
  }

  return new ethers.FallbackProvider([provider]);
};

export const getIsValidChainId = (chainId: string | number) =>
  getIsValidChainIdFn(SUPPORTED_CHAINS, chainId);

export const getChainIdOrDefaultToMainnet = (chainId: string | number) => {
  const x = getChainIdOrDefaultToMainnetFn(SUPPORTED_CHAINS, chainId);
  return x;
};

/**
 * Checks if the provided object is a MethodsBuilder object.
 * A MethodsBuilder object is expected to have certain properties that are
 * used to interact with the blockchain.
 *
 * @param {object} builderIns - The object to check.
 * @returns {boolean} - True if the object is a MethodsBuilder object, false otherwise.
 */
const isMethodsBuilderInstance = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builderIns: object & { _args?: any }, // TODO: provide better type
  registryAddress: Address,
) => {
  if (typeof builderIns !== 'object' || builderIns === null) {
    throw new Error('sendTransaction: Input must be an object.');
  }

  const programId = '_programId' in builderIns ? builderIns?._programId?.toString() : null; // eslint-disable-line no-underscore-dangle

  // Check if the programId is the same as the registry address
  const hasProgramId = programId === registryAddress;

  // Check for a complex property with a specific structure,
  // eslint-disable-next-line no-underscore-dangle
  const isArgsArray = Array.isArray(builderIns._args);

  // Return true if both characteristic properties are as expected
  return hasProgramId && isArgsArray;
};

/**
 * Sends a transaction using the appropriate method based on the virtual machine type.
 * For SVM (Solana Virtual Machine), it uses the rpc method on the function.
 * For EVM (Ethereum Virtual Machine), it uses a generic sendTransaction function.
 *
 * @param {Function} method - The transaction method to be executed.
 * @param {string} account - The account address that is sending the transaction.
 *                           Only required when vmType is EVM
 * @param {Object} extra
 * @param {string} extra.vmType - The virtual machine type to use.
 * @param {string} extra.registryAddress - The address of the registry contract.
 *
 */
export const sendTransaction = (
  method: Contract | ContractV5,
  account: Address,
  extra?: { vmType: string; registryAddress: Address; isLegacy?: boolean },
) => {
  const { vmType, registryAddress, isLegacy } = extra || {};
  if (vmType === VM_TYPE.SVM && registryAddress) {
    // Check if something resembling an SVM method is being passed
    if (!isMethodsBuilderInstance(method, registryAddress)) {
      notifyError('Invalid method object');
      throw new Error('Invalid method object');
    }
    return method.rpc();
  }

  if (isLegacy) {
    return sendTransactionLegacyFn(method as ContractV5, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS as RpcUrl,
    });
  }

  return sendTransactionFn(method as Contract, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS as RpcUrl,
  });
};

export const addressValidator = () => ({
  validator(_: RuleObject, value: StoreValue) {
    return isValidAddress(value)
      ? Promise.resolve()
      : Promise.reject(new Error('Please enter valid addresses.'));
  },
});

// check if the provider is gnosis safe
export const checkIfGnosisSafe = async (
  account: Address,
  provider: JsonRpcProvider | FallbackProvider,
) => {
  try {
    if (provider && provider.getCode) {
      // TODO: getCode has some issues and throws error in console
      const code = await provider.getCode(account);
      return code !== '0x';
    }
  } catch (error) {
    console.error(error);
    return false;
  }
  return false;
};

/**
 * Checks if the network has "Service Manager Token".
 * NOTE: Initially, only mainnet and goerli had service manager token,
 * but now all networks have service manager token. Hence, this function
 * defaults to true BUT can be overridden for specific networks in the future.
 */
export const doesNetworkHaveValidServiceManagerTokenFn = (chainId: number) => !!chainId;

const doesPathIncludesComponents = (path: string) => !!path?.includes('/components');
const doesPathIncludesAgents = (path: string) => !!path?.includes('/agent-blueprints');
export const doesPathIncludesServices = (path: string) => !!path?.includes('/ai-agents');
export const doesPathIncludesComponentsOrAgents = (path: string) => {
  if (!path) return false;
  return doesPathIncludesComponents(path) || doesPathIncludesAgents(path);
};

export const notifyWrongNetwork = () => {
  notifyWarning('Please switch to the correct network and try again');
};

// functions for solana
export const isPageWithSolana = (path: string) => {
  if (!path) return false;
  if (!isString(path)) return false;

  const checkPath = (chain: SolanaChain) =>
    path.toLowerCase().includes(chain.networkName.toLowerCase());
  return SVM_SUPPORTED_CHAINS.some(checkPath);
};

export const isValidSolanaPublicKey = (publicKey: PublicKey) => {
  try {
    const isValid = PublicKey.isOnCurve(publicKey);
    return isValid;
  } catch (e) {
    return false;
  }
};
