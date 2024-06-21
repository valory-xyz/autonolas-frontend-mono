import { toLower } from 'lodash';

import { ALL_SUPPORTED_CHAINS } from '../config/supportedChains';

export const isValidNetworkName = (networkName: string | undefined) => {
  if (!networkName) return false;

  const isValid = ALL_SUPPORTED_CHAINS.some((e) => toLower(e.networkName) === toLower(networkName));
  return isValid;
};

export const getChainIdFromPath = (networkName: string | undefined) => {
  if (!networkName) return null;

  const network = ALL_SUPPORTED_CHAINS.find((e) => toLower(e.networkName) === toLower(networkName));
  return network?.id;
};
