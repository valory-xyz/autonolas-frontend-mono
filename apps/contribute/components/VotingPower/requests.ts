import { getDelegateContributeContract, getVeolasContract } from 'common-util/Contracts';
import { getEstimatedGasLimit } from 'common-util/functions/requests';

/**
 * delegatorList - those who delegated veOlas to the provided account
 */
export const fetchDelegatorList = async ({ account }: { account: string }) => {
  const contract = getDelegateContributeContract();
  const delegatorList = await contract.methods.getDelegatorList(account).call();
  return delegatorList;
};

/**
 * delegatee - who you delegated to
 */
export const fetchDelegatee = async ({ account }: { account: string }) => {
  const contract = getDelegateContributeContract();
  const delegatee = await contract.methods.mapDelegation(account).call();
  return delegatee;
};

/**
 * delegates Contribute voting power to an address.
 */
export const delegate = async ({ account, delegatee }: { account: string; delegatee: string }) => {
  const contract = getDelegateContributeContract();
  const delegateFn = contract.methods.delegate(delegatee);
  const estimatedGas = await getEstimatedGasLimit(delegateFn, account);
  const result = await delegateFn.send({ from: account, gas: estimatedGas });
  return result;
};

export const fetchVeolasBalance = async ({ account }: { account: string }) => {
  const contract = getVeolasContract();
  const balance = await contract.methods.getVotes(account).call();
  return balance;
};
