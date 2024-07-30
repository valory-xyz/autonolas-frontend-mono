import { ContractTransactionReceipt, EventLog } from 'ethers';
import { Address } from 'viem';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import { sendTransaction as sendTransactionFn } from '@autonolas/frontend-library';

import { RPC_URLS } from 'libs/util-constants/src';
import { STAKING_FACTORY, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getEstimatedGasLimit } from 'libs/util-functions/src';

import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';
import { getChainId, getProvider } from 'common-util/functions/frontend-library';

/**
 * returns the web3 details
 */
export const getWeb3Details = () => {
  const chainId = getChainId();
  const web3 = new Web3(getProvider());
  return { web3, chainId };
};

/**
 * returns the contract instance
 * @param {Array} abi - abi of the contract
 * @param {String} contractAddress - address of the contract
 */
const getContract = (abi: AbiItem[], contractAddress: string, chainId?: number) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

export const getVoteWeightingContract = () => {
  const { chainId } = getWeb3Details();
  const abi = VOTE_WEIGHTING.abi as AbiItem[];
  const address = (VOTE_WEIGHTING.addresses as Record<number, string>)[chainId as number];

  console.log('VOTE_WEIGHTING address: ', address);
  const contract = getContract(abi, address);
  return contract;
};

export const getStakingFactoryContract = () => {
  const { chainId } = getWeb3Details();
  const abi = STAKING_FACTORY.abi as AbiItem[];
  const address = (STAKING_FACTORY.addresses as Record<number, string>)[chainId as number];
  const contract = getContract(abi, address);
  return contract;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendTransaction = async (methodFn: any, account: Address) => {
  const estimatedGas = await getEstimatedGasLimit(methodFn, account);
  const fn = methodFn.send({ from: account, estimatedGas });

  console.log('sendTransaction estimatedGas: ', { estimatedGas, SUPPORTED_CHAINS, RPC_URLS });

  return await sendTransactionFn(fn, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS,
  });
};

type CreateContractParams = {
  implementation: Address;
  initPayload: string;
  account: Address;
};

type InstanceCreatedEvent = {
  returnValues: {
    implementation: Address;
    instance: Address;
    sender: Address;
  };
} & EventLog;

export const createStakingContract = async ({
  implementation,
  initPayload,
  account,
}: CreateContractParams) => {
  const contract = getStakingFactoryContract();
  const createFn = contract.methods.createStakingInstance(implementation, initPayload);
  const result = await sendTransaction(createFn, account);

  console.log('createStakingContract contract: ', contract);
  console.log('createStakingContract result: ', result);

  return result as ContractTransactionReceipt & {
    events?: { InstanceCreated: InstanceCreatedEvent };
  };
};

type AddNomineeParams = {
  address: Address;
  chainId: number;
  account: Address;
};

export const addNominee = async ({ address, chainId, account }: AddNomineeParams) => {
  const contract = getVoteWeightingContract();
  const createFn = contract.methods.addNomineeEVM(address, chainId);
  const result = await sendTransaction(createFn, account);

  return result;
};
