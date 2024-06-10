import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import {
  STAKING_FACTORY,
  VE_OLAS,
  VOTE_WEIGHTING,
} from 'libs/util-contracts/src/lib/abiAndAddresses';

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
const getContract = (abi: AbiItem[], contractAddress: string) => {
  const { web3 } = getWeb3Details();
  const contract = new web3.eth.Contract(abi, contractAddress);
  return contract;
};

// TODO: check if we can provide more specific types. Neither BatchRequest type nor Method is exportable
// and BatchRequest type doesn't contain everything that the batchRequest provides
type BatchType = InstanceType<Web3['BatchRequest']> & {
  requests: ({ format: (value: unknown) => void } & unknown)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestManager: any;
};
type Method = Parameters<BatchType['add']>[0];

const getBatch = () => {
  const { web3 } = getWeb3Details();
  const batch = new web3.BatchRequest();
  return batch as BatchType;
};

export const executeBatchAsync = (calls: Method[]): Promise<unknown[]> => {
  const batch = getBatch();
  calls.forEach((call) => {
    batch.add(call);
  });

  return new Promise((resolve, reject) => {
    const requests = batch.requests;
    batch.requestManager?.sendBatch(
      requests,
      (err: Error, results: (unknown & { error: Error; result: unknown })[]) => {
        const response = requests.map((request, index) => {
          const result = results[index] || {};
          if (result && result.error) {
            console.log('error');
          }
          return request.format ? request.format(result.result) : result.result;
        });
        resolve(response);
      },
    );
  });
};

export const getVeOlasContract = () => {
  const { chainId } = getWeb3Details();
  const abi = VE_OLAS.abi as AbiItem[];
  const address = (VE_OLAS.addresses as Record<number, string>)[chainId as number];
  const contract = getContract(abi, address);
  return contract;
};

export const getVoteWeightingContract = () => {
  const { chainId } = getWeb3Details();
  const abi = VOTE_WEIGHTING.abi as AbiItem[];
  const address = (VOTE_WEIGHTING.addresses as Record<number, string>)[chainId as number];
  const contract = getContract(abi, address);
  return contract;
};

export const getStakingFactoryContract = (chainId: number) => {
  const abi = STAKING_FACTORY.abi as AbiItem[];
  const address = (STAKING_FACTORY.addresses as Record<number, string>)[chainId as number];
  const contract = getContract(abi, address);
  return contract;
};
