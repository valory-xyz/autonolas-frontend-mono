import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { memoize, round } from 'lodash';
import { areAddressesEqual, VM_TYPE } from '@autonolas/frontend-library';
import { usePublicClient } from 'wagmi';

import { DEX } from 'common-util/enums';
import { ADDRESS_ZERO, ONE_ETH } from 'common-util/constants/numbers';
import {
  getUniswapV2PairContract,
  getTokenomicsContract,
  getErc20Contract,
  getDepositoryContract,
} from 'common-util/functions/web3';

import { ADDRESSES } from 'common-util/constants/addresses';
import { notifySpecificError } from 'common-util/functions/errors';
import { getChainId } from 'common-util/functions/frontend-library';
import { parseToEth } from 'common-util/functions/ethers';
import { isL1Network } from 'common-util/functions/chains';

import { DEPOSITORY } from 'common-util/abiAndAddresses';
import { BALANCER_GRAPH_CLIENTS } from 'common-util/graphql/clients';
import { balancerGetPoolQuery } from 'common-util/graphql/queries';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { useWhirlPoolInformation } from '../TokenManagement/hooks/useWhirlpool';
import { POSITION } from '../TokenManagement/constants';
import {
  getProductValueFromEvent,
  getLpTokenWithDiscount,
  getLpTokenLink,
  getCurrentPriceLpLink,
  getCreateProductEvents,
  getCloseProductEvents,
} from './utils';

const { BigNumber } = ethers;

/**
 *
 * @returns {Object} {
 *   lpChainId,
 *   originAddress is pool address
 * }
 */
const LP_PAIRS = {
  // gnosis-chain
  '0x27df632fd0dcf191C418c803801D521cd579F18e': {
    lpChainId: 100,
    name: 'OLAS-WXDAI',
    originAddress: '0x79C872Ed3Acb3fc5770dd8a0cD9Cd5dB3B3Ac985',
    dex: DEX.BALANCER,
    poolId:
      '0x79c872ed3acb3fc5770dd8a0cd9cd5db3b3ac985000200000000000000000067',
    guide: 'olas-wxdai-via-balancer-on-gnosis-chain',
  },
  // polygon
  '0xf9825A563222f9eFC81e369311DAdb13D68e60a4': {
    lpChainId: 137,
    name: 'OLAS-WMATIC',
    originAddress: '0x62309056c759c36879Cde93693E7903bF415E4Bc',
    dex: DEX.BALANCER,
    poolId:
      '0x62309056c759c36879cde93693e7903bf415e4bc000200000000000000000d5f',
    guide: 'olas-wmatic-via-balancer-on-polygon-pos',
  },
  // arbitrum
  '0x36B203Cb3086269f005a4b987772452243c0767f': {
    lpChainId: 42161,
    name: 'OLAS-WETH',
    originAddress: '0xaf8912a3c4f55a8584b67df30ee0ddf0e60e01f8',
    dex: DEX.BALANCER,
    poolId:
      '0xaf8912a3c4f55a8584b67df30ee0ddf0e60e01f80002000000000000000004fc',
    guide: 'olas-weth-via-balancer-on-arbitrum',
  },
  // optimism
  '0x2FD007a534eB7527b535a1DF35aba6bD2a8b660F': {
    lpChainId: 10,
    name: 'WETH-OLAS',
    originAddress: '0x5bb3e58887264b667f915130fd04bbb56116c278',
    dex: DEX.BALANCER,
    poolId:
      '0x5bb3e58887264b667f915130fd04bbb56116c27800020000000000000000012a',
    guide: 'weth-olas-via-balancer-on-optimism',
  },
  // base
  '0x9946d6FD1210D85EC613Ca956F142D911C97a074': {
    lpChainId: 8453,
    name: 'OLAS-USDC',
    originAddress: '0x5332584890d6e415a6dc910254d6430b8aab7e69',
    dex: DEX.BALANCER,
    poolId:
      '0x5332584890d6e415a6dc910254d6430b8aab7e69000200000000000000000103',
    guide: 'olas-usdc-via-balancer-on-base',
  },
  // solana
  '0x3685b8cc36b8df09ed9e81c1690100306bf23e04': {
    lpChainId: VM_TYPE.SVM,
    name: 'OLAS-WSOL',
    originAddress: POSITION.toString(),
    dex: DEX.SOLANA,
    poolId: ADDRESSES[VM_TYPE.SVM].balancerVault, // whirpool address
    guide: 'wsol-olas-via-orca-on-solana',
  },
};

export const isSvmLpAddress = (address) =>
  areAddressesEqual(address, '0x3685b8cc36b8df09ed9e81c1690100306bf23e04');

/**
 * fetches the IDF (discount factor) for the product
 */
const getLastIDFRequest = async () => {
  const contract = getTokenomicsContract();
  const lastIdfResponse = await contract.methods.getLastIDF().call();

  /**
   * 1 ETH = 1e18
   * discount = (lastIDF - 1 ETH) / 1 ETH
   */
  const firstDiv = Number(lastIdfResponse) - Number(ONE_ETH);
  const discount = ((firstDiv * 1.0) / Number(ONE_ETH)) * 100;
  return discount;
};

/**
 * Fetches details of the LP token.
 * The token needs to distinguish between the one on the ETH mainnet
 * and the mirrored one from other mainnets.
 *
 * @returns {Object} { lpChainId, originAddress, dex, name, poolId }
 */
const getLpTokenDetails = memoize(async (address) => {
  const currentLpPairDetails = Object.keys(LP_PAIRS).find(
    (key) => key === address,
  );

  // if the address is in the LP_PAIRS list
  if (currentLpPairDetails) {
    return { ...LP_PAIRS[address] };
  }

  window.console.warn('LP pair not found in the LP_PAIRS list');

  // if the address is not in the LP_PAIRS list (mainnet and goerli)
  const chainId = getChainId();
  let tokenSymbol = null;
  try {
    const contract = getUniswapV2PairContract(address);
    const token0 = await contract.methods.token0().call();
    const token1 = await contract.methods.token1().call();
    const erc20Contract = getErc20Contract(
      token0 === ADDRESSES[chainId].olasAddress ? token1 : token0,
    );
    tokenSymbol = await erc20Contract.methods.symbol().call();
  } catch (error) {
    console.error(
      'Error fetching token0 and token1 from the LP pair contract: ',
      address,
    );
  }

  return {
    lpChainId: chainId,
    name: `OLAS${tokenSymbol ? `-${tokenSymbol}` : ''}`,
    originAddress: address,
    dex: DEX.UNISWAP,
    poolId: null,
  };
});

/**
 * Fetches the current "price of the LP token" from Balancer
 */
const getCurrentPriceBalancerFn = memoize(async (tokenAddress) => {
  const { lpChainId, poolId } = await getLpTokenDetails(tokenAddress);

  const { pool } = await BALANCER_GRAPH_CLIENTS[lpChainId].request(
    balancerGetPoolQuery(poolId),
  );

  if (!pool) {
    throw new Error(
      `Pool not found on Balancer for poolId: ${poolId} and chainId: ${lpChainId}.`,
    );
  }

  const totalSupply = pool.totalShares;
  const firstPoolTokenAddress = pool.tokens[0].address;
  const olasTokenAddress = ADDRESSES[lpChainId].olasAddress;
  const reservesOlas =
    (areAddressesEqual(firstPoolTokenAddress, olasTokenAddress)
      ? pool.tokens[0].balance
      : pool.tokens[1].balance) * 1.0;
  const priceLp = (reservesOlas * 10 ** 18) / totalSupply;
  return priceLp;
});

/**
 * hook to add the current LP price to the products
 */
const useAddCurrentLpPriceToProducts = () => {
  const getCurrentPriceWhirlpool = useWhirlPoolInformation();
  const publicClient = usePublicClient();

  const getCurrentPriceBalancer = useCallback(getCurrentPriceBalancerFn, [
    getCurrentPriceBalancerFn,
  ]);

  const getCurrentPriceForSvm = useCallback(async () => {
    const priceLp = await getCurrentPriceWhirlpool(
      ADDRESSES[VM_TYPE.SVM].balancerVault, // whirpool address
    );
    return priceLp;
  }, [getCurrentPriceWhirlpool]);

  return useCallback(
    async (productList) => {
      const chainId = getChainId();
      const multicallRequests = {};
      const otherRequests = {};

      for (let i = 0; i < productList.length; i += 1) {
        if (productList[i].token === ADDRESS_ZERO) {
          otherRequests[i] = 0;
        } else {
          /* eslint-disable-next-line no-await-in-loop */
          const { lpChainId, dex } = await getLpTokenDetails(
            productList[i].token,
          );

          if (isL1Network(lpChainId)) {
            multicallRequests[i] = {
              address: DEPOSITORY.addresses[chainId],
              abi: DEPOSITORY.abi,
              functionName: 'getCurrentPriceLP',
              args: [productList[i].token],
            };
          } else {
            let currentLpPrice = null;
            // NOTE: It could be uniswap for other chains hence this if case.
            // (commented for now)
            // if (dex === DEX.UNISWAP) {
            //   currentLpPricePromise = contract.methods
            //     .getCurrentPriceUniswap(originAddress)
            //     .call();
            //   currentLpPricePromiseList.push(currentLpPricePromise);
            // } else
            if (dex === DEX.BALANCER) {
              currentLpPrice = getCurrentPriceBalancer(productList[i].token);
              otherRequests[i] = currentLpPrice;
            } else if (dex === DEX.SOLANA) {
              currentLpPrice = getCurrentPriceForSvm(productList[i].token);
              otherRequests[i] = currentLpPrice;
            } else {
              throw new Error('Dex not supported');
            }
          }
        }
      }

      const multicallResponses = await publicClient.multicall({
        contracts: Object.values(multicallRequests),
      });
      const otherResponses = await Promise.all(Object.values(otherRequests));

      // Combine multicall responses with other responses into resolvedList
      const resolvedList = [];
      Object.keys(multicallRequests).forEach((index) => {
        resolvedList[index] = multicallResponses.shift().result.toString();
      });
      Object.keys(otherRequests).forEach((index) => {
        resolvedList[index] = otherResponses.shift();
      });

      return productList.map((product, index) => ({
        ...product,
        currentPriceLp: resolvedList[index],
      }));
    },
    [publicClient, getCurrentPriceBalancer, getCurrentPriceForSvm],
  );
};

/**
 * Fetches the LP token details for the product list and adds
 * the following details to the list
 * @example
 * input: [{ token: '0x', ...others }]
 * output: [{
 *   ...others,
 *   currentPriceLpLink: 'https://...',
 *   lpChainId: xx,
 *   lpTokenLink: https://...,
 *   lpTokenName: 'OLAS-ETH',
 * }]
 */
const getLpTokenNamesForProducts = async (productList, events) => {
  const lpTokenNamePromiseList = [];

  for (let i = 0; i < productList.length; i += 1) {
    const tokenAddress = getProductValueFromEvent(
      productList[i],
      events,
      'token',
    );
    const tokenDetailsPromise = getLpTokenDetails(tokenAddress);
    lpTokenNamePromiseList.push(tokenDetailsPromise);
  }

  const lpTokenDetailsList = await Promise.all(lpTokenNamePromiseList);

  return productList.map((component, index) => {
    const { name, poolId, lpChainId, guide } = lpTokenDetailsList[index];
    const lpTokenLink = getLpTokenLink({
      lpDex: lpTokenDetailsList[index].dex,
      lpChainId,
      lpPoolId: poolId,
      productName: component.token,
    });
    const currentPriceLpLink = getCurrentPriceLpLink({
      lpDex: lpTokenDetailsList[index].dex,
      lpChainId,
    });

    return {
      ...component,
      lpChainId,
      lpTokenName: name,
      lpTokenLink,
      currentPriceLpLink,
      guide,
    };
  });
};

/**
 * hook to add the supply left to the products
 * @example
 * input: [{ list }]
 * output: [{
 *   ...list,
 *   supplyLeft,
 *   priceLp
 * }]
 */
const useAddSupplyLeftToProducts = () =>
  useCallback(
    async (list, createProductEvents, closedProductEvents = []) =>
      list.map((product) => {
        const createProductEvent = createProductEvents?.find(
          (event) => event.productId === `${product.id}`,
        );

        const closeProductEvent = closedProductEvents?.find(
          (event) => event.productId === `${product.id}`,
        );

        // Should not happen but we will warn if it does
        if (!createProductEvent) {
          window.console.warn(
            `Product ${product.id} not found in the event list`,
          );
        }

        const eventSupply = Number(
          BigNumber.from(createProductEvent.supply).div(ONE_ETH),
        );

        const productSupply = !closeProductEvent
          ? Number(BigNumber.from(product.supply).div(ONE_ETH))
          : Number(BigNumber.from(closeProductEvent.supply).div(ONE_ETH));

        const supplyLeft = productSupply / Number(eventSupply);

        const priceLp =
          product.token !== ADDRESS_ZERO
            ? product.priceLp
            : createProductEvent?.priceLp || 0;

        return { ...product, supplyLeft, priceLp };
      }),
    [],
  );

/**
 * Adds the projected change & discounted olas per LP token to the list.
 * Also, multiplies the current price of the LP token by 2
 * @example input: [{ ...list }]
 * @example output: [
 *  { ...list,
 *    fullCurrentPriceLp,
 *    roundedDiscountedOlasPerLpToken,
 *    projectedChange
 *  }
 * ]
 */
const useAddProjectChangeToProducts = () =>
  useCallback(
    (productList) =>
      productList.map((record) => {
        // To calculate the price of LP we need to multiply (olasReserve / TotalSupply) by 2
        const currentPriceLpInBg = BigNumber.from(
          `${record.currentPriceLp || 0}`,
        );
        const doubledCurrentPriceLp = currentPriceLpInBg.mul(2).toString();

        const parsedDoubledCurrentPriceLp =
          parseToEth(doubledCurrentPriceLp) /
          (isSvmLpAddress(record.token) ? 10 ** 10 : 1);

        const fullCurrentPriceLp =
          Number(round(parsedDoubledCurrentPriceLp, 2)) || '0';

        // get the discounted OLAS per LP token
        const discountedOlasPerLpTokenInBg = getLpTokenWithDiscount(
          record.priceLp || 0,
          record.discount || 0,
        );

        // parse to eth and round to 2 decimal places
        const roundedDiscountedOlasPerLpToken = round(
          parseToEth(discountedOlasPerLpTokenInBg) /
            (isSvmLpAddress(record.token) ? 10 ** 10 : 1),
          2,
        );

        // calculate the projected change
        const difference = roundedDiscountedOlasPerLpToken - fullCurrentPriceLp;
        const projectedChange = round(
          (difference / fullCurrentPriceLp) * 100,
          2,
        );

        return {
          ...record,
          fullCurrentPriceLp,
          roundedDiscountedOlasPerLpToken,
          projectedChange,
        };
      }),
    [],
  );

/**
 * Fetches product details from the product ids and updates the list
 * to include other details such as the LP token name, supply left, etc.
 * and returns the updated list.
 */
const useProductDetailsFromIds = () => {
  const publicClient = usePublicClient();
  const addSupplyLeftToProducts = useAddSupplyLeftToProducts();
  const addCurrentLpPriceToProducts = useAddCurrentLpPriceToProducts();
  const addProjectedChange = useAddProjectChangeToProducts();

  return useCallback(
    async (productIdList) => {
      const chainId = getChainId();

      const response = await publicClient.multicall({
        contracts: productIdList.map((id) => ({
          address: DEPOSITORY.addresses[chainId],
          abi: DEPOSITORY.abi,
          functionName: 'mapBondProducts',
          args: [id],
        })),
      });

      // discount factor is same for all the products
      const discount = await getLastIDFRequest();

      const productList = response.map(({ result: product }, index) => {
        const [priceLP, vesting, token, supply] = product;

        return {
          id: productIdList[index],
          discount,
          priceLp: priceLP,
          vesting,
          token,
          supply,
        };
      });

      const listWithCurrentLpPrice =
        await addCurrentLpPriceToProducts(productList);

      const createEventList = await getCreateProductEvents();
      const closedEventList = await getCloseProductEvents();

      const listWithLpTokens = await getLpTokenNamesForProducts(
        listWithCurrentLpPrice,
        createEventList,
      );

      const listWithSupplyList = await addSupplyLeftToProducts(
        listWithLpTokens,
        createEventList,
        closedEventList,
      );

      const listWithProjectedChange = addProjectedChange(listWithSupplyList);

      return listWithProjectedChange;
    },
    [
      publicClient,
      addCurrentLpPriceToProducts,
      addSupplyLeftToProducts,
      addProjectedChange,
    ],
  );
};

/**
 * fetches product list based on the active/inactive status
 */
const useProductListRequest = ({ isActive }) => {
  const getProductDetailsFromIds = useProductDetailsFromIds();

  return useCallback(async () => {
    const contract = getDepositoryContract();
    const productIdList = await contract.methods.getProducts(isActive).call();
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
  const [isLoading, setIsLoading] = useState(false);
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
