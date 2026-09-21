import { readContract } from '@wagmi/core';
import { useCallback, useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';

import { wagmiConfig } from 'common-util/config/wagmi';
import { ADDRESSES } from 'common-util/constants/addresses';
import { depositoryParams } from 'common-util/Contracts/params';
import { getProductDetailsFromIds } from 'common-util/functions/bondingProducts';
import { notifySpecificError } from 'common-util/functions/errors';
import { getChainId } from 'common-util/functions/frontend-library';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { useWhirlPoolInformation } from '../TokenManagement/hooks/useWhirlpool';

/**
 * The browser side of the bonding-products pipeline: thin hooks over the plain functions in
 * `common-util/functions/bondingProducts`, supplying what only a browser has - the connected
 * chain, the wagmi public client's multicall, and the Solana whirlpool price.
 */

const useProductDetailsFromIds = () => {
  const publicClient = usePublicClient();
  const getCurrentPriceWhirlpool = useWhirlPoolInformation();

  return useCallback(
    (productIdList) =>
      getProductDetailsFromIds(productIdList, {
        chainId: getChainId(),
        multicall: (args) => publicClient.multicall(args),
        getCurrentPriceWhirlpool,
      }),
    [publicClient, getCurrentPriceWhirlpool],
  );
};

/**
 * fetches product list based on the active/inactive status
 */
const useProductListRequest = ({ isActive }) => {
  const getProductDetailsFromIds = useProductDetailsFromIds();

  return useCallback(async () => {
    const chainId = getChainId();
    const productIdList = await readContract(wagmiConfig, {
      ...depositoryParams(chainId),
      functionName: 'getProducts',
      args: [isActive],
    });
    const response = await getProductDetailsFromIds(productIdList);

    const productList = response.map((product, index) => ({
      id: productIdList[index],
      key: productIdList[index],
      ...product,
    }));

    return productList;
  }, [getProductDetailsFromIds, isActive]);
};

export const useProducts = ({ isActive }) => {
  // Starts loading: the first fetch fires on mount, and server HTML rendered as not loading
  // would say "No bonding products" next to the pre-rendered summary that lists them.
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productDetails, setProductDetails] = useState(null); // if `not null`, open deposit modal

  const { chainId } = useHelpers();
  const getProductListRequest = useProductListRequest({ isActive });

  const getProducts = useCallback(async () => {
    try {
      setErrorState(false);
      setIsLoading(true);

      const filteredProductList = await getProductListRequest({
        isActive,
      });
      setFilteredProducts(filteredProductList);
    } catch (e) {
      const errorMessage = typeof e?.message === 'string' ? e.message : null;
      setErrorState(true);
      notifySpecificError('Error while fetching products', errorMessage);
      console.error(e, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, getProductListRequest]);

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  const handleProductDetails = useCallback(
    (row) => {
      setProductDetails(row);
    },
    [setProductDetails],
  );

  return {
    isLoading,
    errorState,
    filteredProducts,
    productDetails,
    handleProductDetails,
    depositoryAddress: ADDRESSES[chainId].depository,
    refetch: getProducts,
  };
};
