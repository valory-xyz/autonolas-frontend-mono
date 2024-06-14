import { toLower } from 'lodash';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';

import { URL } from 'common-util/constants/url';
import { useGetChainIdFromPath } from 'common-util/hooks/useNetworkHelpers';
import { useAppDispatch } from 'store/index';
import { setNetworkId, setNetworkName } from 'store/network';

import {
  ALL_SUPPORTED_CHAINS,
  PAGES_TO_LOAD_WITHOUT_CHAINID,
} from '../../../common-util/config/supportedChains';

const isValidNetworkName = (name?: string) => {
  if (!name) return false;

  const isValid = ALL_SUPPORTED_CHAINS.some((e) => toLower(e.networkName) === toLower(name));
  return isValid;
};

/**
 * Hook to handle the routing
 */
export const useHandleRoute = () => {
  const router = useRouter();
  const path = router?.pathname || '';
  const networkNameFromUrl = router?.query?.network as string | undefined;
  const chainIdFromPath = useGetChainIdFromPath(networkNameFromUrl);

  const dispatch = useAppDispatch();

  console.log('networkNameFromUrl', networkNameFromUrl, router, ALL_SUPPORTED_CHAINS);

  // updating the blockchain information in redux
  useEffect(() => {
    const isValidNetwork = isValidNetworkName(networkNameFromUrl);

    dispatch(setNetworkName(isValidNetwork ? networkNameFromUrl : 'ethereum'));
    dispatch(setNetworkId(isValidNetwork ? chainIdFromPath : 1));
  }, [dispatch, networkNameFromUrl, chainIdFromPath]);

  /**
   * useEffect to handle the routing based on the path
   */
  useEffect(() => {
    if (PAGES_TO_LOAD_WITHOUT_CHAINID.includes(path)) {
      return;
    }

    // if already on 404 page then no need to redirect
    if (path === `/${URL.pageNotFound}`) {
      return;
    }

    // if already on my-staking-contracts or proposals page then no need to redirect
    if ([`/[network]/${URL.myStackingContract}`].includes(router.asPath)) {
      return;
    }

    // if networkNameFromUrl is not present then redirect to 404 page
    if (!networkNameFromUrl) {
      console.log('redirecting to 404 --- 1');
      router.push(`/${URL.pageNotFound}`);
      return;
    }

    /**
     * if user navigates to `/` (homepage) then
     * redirect to `/ethereum/my-staking-contracts` page
     */
    if (path === '/') {
      router.push(`/ethereum/${URL.myStackingContract}`);
      return;
    }

    /**
     * if the network name is invalid, eg.
     * - user navigates to `/random-page` => redirect to `/page-not-found`
     * - user navigates to `/random/my-staking-contracts` => `/page-not-found`
     * -
     */
    if (!isValidNetworkName(networkNameFromUrl)) {
      console.log('redirecting to 404 --- 2');
      router.push(`/${URL.pageNotFound}`);
      return;
    }

    // eg. /ethereum/my-staking-contracts => ['ethereum', 'my-staking-contracts']
    // eg 1. pathArray = [networkName, my-stacking-contracts]
    const pathArray = (path?.split('/') || []).filter(Boolean) || [];

    const listingPage = pathArray.length >= 2;
    if (listingPage && !isValidNetworkName(networkNameFromUrl)) {
      /**
       * eg.
       * - /random-page => /404
       * - /ethereummmmTypo => /404
       */
      console.log('redirecting to 404 --- 3');
      router.push(`/${URL.pageNotFound}`);
      return;
    }

    /**
     * - if user navigates to `/ethereum/my-stack-contracts` then no need to redirect
     * - if user navigates to `/` then redirect to `/ethereum/my-stack-contracts` page
     * - if user navigates to `/ethereum` then redirect to `/ethereum/my-stack-contracts` page
     * - if user navigates to `/random-page` then redirect to `/404`
     */

    // User navigates to `/[network]`
    if (!PAGES_TO_LOAD_WITHOUT_CHAINID.includes(router.asPath) && pathArray.length === 1) {
      router.push(`/${networkNameFromUrl}/${URL.myStackingContract}`);
      return;
    }
  }, [path, networkNameFromUrl, router]);

  const onHomeClick = useCallback(() => {
    if (networkNameFromUrl) {
      router.push(`/${networkNameFromUrl}/${URL.myStackingContract}`);
    } else {
      router.push(`/ethereum/${URL.myStackingContract}`);
    }
  }, [networkNameFromUrl, router]);

  return { onHomeClick };
};
