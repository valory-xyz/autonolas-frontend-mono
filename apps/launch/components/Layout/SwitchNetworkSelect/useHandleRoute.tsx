import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';

import { PAGES_TO_LOAD_WITH_CHAIN_ID } from 'common-util/config/supportedChains';
import { URL } from 'common-util/constants/urls';
import { getChainIdFromPath, isValidNetworkName } from 'common-util/hooks/useNetworkHelpers';
import { useAppDispatch } from 'store/index';
import { setNetworkId, setNetworkName } from 'store/network';

/**
 * Hook to handle the routing
 */
export const useHandleRoute = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const path = router?.pathname || '';
  const networkNameFromUrl = router?.query?.network as string | undefined;

  const chainIdFromPath = getChainIdFromPath(networkNameFromUrl);

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
    if (!PAGES_TO_LOAD_WITH_CHAIN_ID.includes(path)) {
      return;
    }

    // if already on 404 page then no need to redirect
    if (path === `/${URL.pageNotFound}`) {
      return;
    }

    // if already on my-staking-contracts page then no need to redirect
    if ([`/[network]/${URL.myStakingContract}`].includes(router.asPath)) {
      return;
    }

    // if networkNameFromUrl is not present then redirect to 404 page
    if (!networkNameFromUrl) {
      router.push(`/${URL.pageNotFound}`);
      return;
    }

    /**
     * if user navigates to `/` (homepage) then
     * redirect to `/ethereum/my-staking-contracts` page
     */
    if (path === '/') {
      router.push(`/ethereum/${URL.myStakingContract}`);
      return;
    }

    /**
     * if the network name is invalid, eg.
     * - user navigates to `/random-page` => redirect to `/page-not-found`
     * - user navigates to `/random/my-staking-contracts` => `/page-not-found`
     * -
     */
    if (!isValidNetworkName(networkNameFromUrl)) {
      router.push(`/${URL.pageNotFound}`);
      return;
    }

    // eg. /ethereum/my-staking-contracts => ['ethereum', 'my-staking-contracts']
    // eg 1. pathArray = [networkName, my-staking-contracts]
    const pathArray = (path?.split('/') || []).filter(Boolean) || [];

    const listingPage = pathArray.length >= 2;
    if (listingPage && !isValidNetworkName(networkNameFromUrl)) {
      /**
       * eg.
       * - /random-page => /404
       * - /ethereummmmTypo => /404
       */
      router.push(`/${URL.pageNotFound}`);
      return;
    }

    /**
     * - if user navigates to `/ethereum/my-staking-contracts` then no need to redirect
     * - if user navigates to `/` then redirect to `/ethereum/my-staking-contracts` page
     * - if user navigates to `/ethereum` then redirect to `/ethereum/my-staking-contracts` page
     * - if user navigates to `/random-page` then redirect to `/404`
     */

    // User navigates to `/[network]`
    if (PAGES_TO_LOAD_WITH_CHAIN_ID.includes(router.asPath) && pathArray.length === 1) {
      router.push(`/${networkNameFromUrl}/${URL.myStakingContract}`);
      return;
    }
  }, [path, networkNameFromUrl, router]);

  const onHomeClick = useCallback(() => {
    if (networkNameFromUrl) {
      router.push(`/${networkNameFromUrl}/${URL.myStakingContract}`);
    } else {
      router.push(`/ethereum/${URL.myStakingContract}`);
    }
  }, [networkNameFromUrl, router]);

  return { onHomeClick };
};
