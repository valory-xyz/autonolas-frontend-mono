import { toLower } from 'lodash';
import { useRouter } from 'next/router';

import { ALL_SUPPORTED_CHAINS } from '../config/supportedChains';

export const useIsValidNetworkName = (name?: string) => {
  if (!name) return false;

  const isValid = ALL_SUPPORTED_CHAINS.some((e) => toLower(e.networkName) === toLower(name));
  return isValid;
};

export const useNetworkNameFromUrl = () => {
  const router = useRouter();
  const networkNameFromUrl = router?.query?.network as string | undefined;

  return networkNameFromUrl || 'ethereum';
};

export const useNetworkIdFromUrl = () => {
  const networkNameFromUrl = useNetworkNameFromUrl();
  const network = ALL_SUPPORTED_CHAINS.find(
    (e) => toLower(e.networkName) === toLower(networkNameFromUrl),
  );

  return network?.id;
};

export const useNetworkHelpers = () => {
  return {
    networkId: useNetworkIdFromUrl(),
  };
};

export const useGetChainIdFromPath = (networkName: string | undefined) => {
  if (!networkName) return null;
  return ALL_SUPPORTED_CHAINS.find((e) => toLower(e.networkName) === toLower(networkName))?.id;
};
