import Web3 from 'web3';

import { getChainId, getProvider } from 'common-util/functions/frontend-library';

/**
 * returns the web3 details
 */
export const getWeb3Details = () => {
  const chainId = getChainId();
  const web3 = new Web3(getProvider());
  return { web3, chainId };
};
