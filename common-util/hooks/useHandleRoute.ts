import { toLower } from 'lodash';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setChainId } from 'store/setup/actions';
import { PAGES_TO_LOAD_WITHOUT_CHAIN_ID, URL } from 'util/constants';

import { ALL_SUPPORTED_CHAINS, FIRST_SUPPORTED_CHAIN } from '../Login/config';

const isValidNetworkName = (name: string) => {
  const isValid = ALL_SUPPORTED_CHAINS.some((e) => toLower(e.networkName) === toLower(name));
  return isValid;
};

const getChainIdFromPath = (networkName: string) =>
  ALL_SUPPORTED_CHAINS.find((e) => toLower(e.networkName) === toLower(networkName))?.id;

/**
 * Hook to handle the routing
 */
export const useHandleRoute = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const path = router?.pathname || '';
  const networkNameFromUrl = router?.query?.network;

  const dispatchWithDelay = useCallback(
    // @ts-ignore TODO: set types for store
    (action) => {
      setTimeout(() => {
        dispatch(action);
      }, 0);
    },
    [dispatch],
  );

  const updateChainId = useCallback(
    (id: number) => {
      dispatchWithDelay(setChainId(id));
    },
    [dispatchWithDelay],
  );

  // updating the blockchain information in redux
  useEffect(() => {
    const chainIdFromPath =
      typeof networkNameFromUrl === 'string' ? getChainIdFromPath(networkNameFromUrl) : undefined;
    updateChainId(chainIdFromPath ?? FIRST_SUPPORTED_CHAIN.id);
  }, [networkNameFromUrl, dispatchWithDelay, updateChainId]);

  useEffect(() => {
    if (PAGES_TO_LOAD_WITHOUT_CHAIN_ID.includes(path)) {
      return;
    }

    /**
     * if the network name is invalid, eg.
     * - user navigates to `/random-page` => redirect to `/page-not-found`
     * - user navigates to `/random/mechs` => `/page-not-found`
     * -
     */
    if (typeof networkNameFromUrl === 'string' && !isValidNetworkName(networkNameFromUrl)) {
      router.push(`/${URL.PAGE_NOT_FOUND}`);
      return;
    }

    // eg. /gnosis/page => ['gnosis', 'page']
    const pathArray = (path?.split('/') || []).filter(Boolean) || [];

    // User navigates to `/[network]`
    if (pathArray.length === 1) {
      router.push(`/${networkNameFromUrl}/${URL.MECHS}`);
      return;
    }
  }, [networkNameFromUrl, path, router]);

  return { updateChainId };
};
