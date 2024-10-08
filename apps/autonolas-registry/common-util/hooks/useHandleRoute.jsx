import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { toLower } from 'lodash';

import { setVmInfo, setChainId } from 'store/setup';
import { PAGES_TO_LOAD_WITHOUT_CHAINID, SOLANA_CHAIN_NAMES, URL } from 'util/constants';
import { useHelpers } from '../hooks';
import { ALL_SUPPORTED_CHAINS, EVM_SUPPORTED_CHAINS } from '../Login/config';
import { doesPathIncludesComponentsOrAgents, isPageWithSolana } from '../functions';

const isValidNetworkName = (name) => {
  const isValid = ALL_SUPPORTED_CHAINS.some((e) => toLower(e.networkName) === toLower(name));
  return isValid;
};

const getChainIdFromPath = (networkName) =>
  EVM_SUPPORTED_CHAINS.find((e) => toLower(e.networkName) === toLower(networkName))?.id;

const isValidL1NetworkName = (name) => {
  if (name === 'ethereum') return true;
  if (name === 'goerli') return true;
  return false;
};

/**
 * Hook to handle the routing
 */
export const useHandleRoute = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isL1Network } = useHelpers();
  const path = router?.pathname || '';
  const networkNameFromUrl = router?.query?.network;

  const dispatchWithDelay = useCallback(
    (action) => {
      setTimeout(() => {
        dispatch(action);
      }, 0);
    },
    [dispatch],
  );

  const updateChainId = useCallback(
    (id) => {
      sessionStorage.setItem('chainId', id);
      dispatchWithDelay(setChainId(id));
    },
    [dispatchWithDelay],
  );

  // updating the blockchain information in redux
  useEffect(() => {
    const isValidNetwork = isValidNetworkName(networkNameFromUrl);
    dispatchWithDelay(setVmInfo(networkNameFromUrl));

    if (!isPageWithSolana(networkNameFromUrl)) {
      const chainIdFromPath = getChainIdFromPath(networkNameFromUrl);
      updateChainId(isValidNetwork ? chainIdFromPath : 1);
    }
  }, [networkNameFromUrl, dispatchWithDelay, updateChainId]);

  useEffect(() => {
    if (PAGES_TO_LOAD_WITHOUT_CHAINID.includes(path)) {
      return;
    }

    /**
     * if user navigates to `/` (homepage) then
     * redirect to `/ethereum/components` page
     */
    if (path === '/') {
      router.push('/ethereum/components');
      return;
    }

    /**
     * if the network name is invalid, eg.
     * - user navigates to `/random-page` => redirect to `/page-not-found`
     * - user navigates to `/random/components` => `/page-not-found`
     * -
     */
    if (!isValidNetworkName(networkNameFromUrl)) {
      router.push(URL.PAGE_NOT_FOUND);
      return;
    }

    // eg. /ethereum/components => ['ethereum', 'components']
    // eg 1. pathArray = [networkName, components/agents/services]
    // eg 2. pathArray = [networkName, agents, mint]
    const pathArray = (path?.split('/') || []).filter(Boolean);

    const listingPage = pathArray >= 2;
    if (listingPage && !isValidNetworkName(networkNameFromUrl)) {
      /**
       * eg.
       * - /random-page => /page-not-found
       * - /ethereummmmTypo => /page-not-found
       */
      router.push(URL.PAGE_NOT_FOUND);
      return;
    }

    /**
     * - if user navigates to `/ethereum/components` then no need to redirect
     * - if user navigates to `/` then redirect to `/ethereum/components` page
     * - if user navigates to `/ethereum` then redirect to `/ethereum/components` page
     * - if user navigates to `/random-page` then redirect to `/page-not-found`
     */

    // User navigates to `/[network]`
    if (!PAGES_TO_LOAD_WITHOUT_CHAINID.includes(router.asPath) && pathArray.length === 1) {
      router.push(`/${networkNameFromUrl}/${isL1Network ? 'components' : 'services'}`);
      return;
    }

    // ONLY components, agents
    /**
     * if user navigates to `/ethereum/components` or `/ethereum/agents` then no need to redirect
     * if user navigates to `/goerli/components` or `/goerli/agents` then no need to redirect
     *
     * if user navigates to `/ethereum/random-page redirect to `/page-not-found`
     *
     * if user navigates to `/gnosis/components redirect to `/gnosis/services`
     * because components & agents are not supported on gnosis
     */

    if (!isValidL1NetworkName(networkNameFromUrl) && doesPathIncludesComponentsOrAgents(path)) {
      router.push(`/${networkNameFromUrl}/services`);
    }
  }, [path, networkNameFromUrl, isL1Network, router]);

  const onHomeClick = () => {
    const isSvm =
      networkNameFromUrl === SOLANA_CHAIN_NAMES.DEVNET ||
      networkNameFromUrl === SOLANA_CHAIN_NAMES.MAINNET;

    const getListName = () => {
      if (isSvm) return 'services';
      if (isL1Network) return 'components';
      return 'services';
    };

    if (networkNameFromUrl) {
      router.push(`/${networkNameFromUrl}/${getListName()}`);
    } else {
      router.push('/ethereum/components');
    }
  };

  return { onHomeClick, updateChainId };
};
