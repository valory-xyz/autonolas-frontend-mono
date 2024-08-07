import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { isString } from 'lodash';

import {
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  isValidAddress,
  notifyError,
  notifyWarning,
  sendTransaction as sendTransactionFn,
} from '@autonolas/frontend-library';

import { VM_TYPE } from '../../util/constants';
import { RPC_URLS } from '../Contracts';
import { SUPPORTED_CHAINS } from '../Login';
import { EVM_SUPPORTED_CHAINS, SVM_SUPPORTED_CHAINS } from '../Login/config';

export const getModalProvider = () => window?.MODAL_PROVIDER;

export const getWindowEthereum = () => window?.ethereum;

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
  const rpcUrl = RPC_URLS[defaultChainId];

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

export const getIsValidChainId = (chainId) => getIsValidChainIdFn(SUPPORTED_CHAINS, chainId);

export const getChainIdOrDefaultToMainnet = (chainId) => {
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
const isMethodsBuilderInstance = (builderIns, registryAddress) => {
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
export const sendTransaction = (method, account, extra) => {
  const { vmType, registryAddress } = extra || {};
  if (vmType === VM_TYPE.SVM) {
    // Check if something resembling an SVM method is being passed
    if (!isMethodsBuilderInstance(method, registryAddress)) {
      notifyError('Invalid method object');
      throw new Error('Invalid method object');
    }
    return method.rpc();
  }

  return sendTransactionFn(method, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS,
  });
};

export const addressValidator = () => ({
  validator(_, value) {
    return isValidAddress(value)
      ? Promise.resolve()
      : Promise.reject(new Error('Please enter valid addresses.'));
  },
});

// check if the provider is gnosis safe
export const checkIfGnosisSafe = async (account, provider) => {
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
};

/**
 * Checks if the network has "Service Manager Token".
 * NOTE: Initially, only mainnet and goerli had service manager token,
 * but now all networks have service manager token. Hence, this function
 * defaults to true BUT can be overridden for specific networks in the future.
 */
export const doesNetworkHaveValidServiceManagerTokenFn = (chainId) => !!chainId;

const doesPathIncludesComponents = (path) => !!path?.includes('components');
const doesPathIncludesAgents = (path) => !!path?.includes('agents');
export const doesPathIncludesServices = (path) => !!path?.includes('services');
export const doesPathIncludesComponentsOrAgents = (path) => {
  if (!path) return false;
  return doesPathIncludesComponents(path) || doesPathIncludesAgents(path);
};

export const notifyWrongNetwork = () => {
  notifyWarning('Please switch to the correct network and try again');
};

// functions for solana
export const isPageWithSolana = (path) => {
  if (!path) return false;
  if (!isString(path)) return false;

  const checkPath = (chain) => path.toLowerCase().includes(chain.networkName.toLowerCase());
  return SVM_SUPPORTED_CHAINS.some(checkPath);
};

export const isValidSolanaPublicKey = (publicKey) => {
  try {
    const isValid = PublicKey.isOnCurve(publicKey);
    return isValid;
  } catch (e) {
    return false;
  }
};
