import { ethers } from 'ethers';
import { find, memoize, round } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { arbitrum, base, celo, gnosis, optimism, polygon } from 'viem/chains';
import { usePublicClient } from 'wagmi';

import { VM_TYPE, areAddressesEqual } from '@autonolas/frontend-library';

import { DEPOSITORY } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { ADDRESSES } from 'common-util/constants/addresses';
import { ADDRESS_ZERO, ONE_ETH } from 'common-util/constants/numbers';
import { DEX } from 'common-util/enums';
import { isL1Network } from 'common-util/functions/chains';
import { notifySpecificError } from 'common-util/functions/errors';
import { parseToEth } from 'common-util/functions/ethers';
import { getChainId } from 'common-util/functions/frontend-library';
import {
  getDepositoryContract,
  getErc20Contract,
  getTokenomicsContract,
  getUniswapV2PairContract,
  getUniswapV2PairContractByChain,
} from 'common-util/functions/web3';
import { BALANCER_GRAPH_CLIENTS } from 'common-util/graphql/clients';
import { balancerGetPoolQuery } from 'common-util/graphql/queries';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { POSITION } from '../TokenManagement/constants';
import { useWhirlPoolInformation } from '../TokenManagement/hooks/useWhirlpool';
import {
  getCloseProductEvents,
  getCreateProductEvents,
  getCurrentPriceLpLink,
  getLpLink,
  getLpTokenWithDiscount,
  getProductValueFromEvent,
} from './utils';

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
    lpChainId: gnosis.id,
    name: 'OLAS-WXDAI',
    originAddress: '0x79C872Ed3Acb3fc5770dd8a0cD9Cd5dB3B3Ac985',
    dex: DEX.BALANCER.name,
    poolId: '0x79c872ed3acb3fc5770dd8a0cd9cd5db3b3ac985000200000000000000000067',
    guide: 'olas-wxdai-via-balancer-on-gnosis-chain',
  },
  // polygon
  '0xf9825A563222f9eFC81e369311DAdb13D68e60a4': {
    lpChainId: polygon.id,
    name: 'OLAS-WMATIC',
    originAddress: '0x62309056c759c36879Cde93693E7903bF415E4Bc',
    dex: DEX.BALANCER.name,
    poolId: '0x62309056c759c36879cde93693e7903bf415e4bc000200000000000000000d5f',
    guide: 'olas-wmatic-via-balancer-on-polygon-pos',
  },
  // arbitrum
  '0x36B203Cb3086269f005a4b987772452243c0767f': {
    lpChainId: arbitrum.id,
    name: 'OLAS-WETH',
    originAddress: '0xaf8912a3c4f55a8584b67df30ee0ddf0e60e01f8',
    dex: DEX.BALANCER.name,
    poolId: '0xaf8912a3c4f55a8584b67df30ee0ddf0e60e01f80002000000000000000004fc',
    guide: 'olas-weth-via-balancer-on-arbitrum',
  },
  // optimism
  '0x2FD007a534eB7527b535a1DF35aba6bD2a8b660F': {
    lpChainId: optimism.id,
    name: 'WETH-OLAS',
    originAddress: '0x5bb3e58887264b667f915130fd04bbb56116c278',
    dex: DEX.BALANCER.name,
    poolId: '0x5bb3e58887264b667f915130fd04bbb56116c27800020000000000000000012a',
    guide: 'weth-olas-via-balancer-on-optimism',
  },
  // base OLAS-USDC
  '0x9946d6FD1210D85EC613Ca956F142D911C97a074': {
    lpChainId: base.id,
    name: 'OLAS-USDC',
    originAddress: '0x5332584890d6e415a6dc910254d6430b8aab7e69',
    dex: DEX.BALANCER.name,
    poolId: '0x5332584890d6e415a6dc910254d6430b8aab7e69000200000000000000000103',
    guide: 'olas-usdc-via-balancer-on-base',
  },
  // base WETH-OLAS
  '0xad47b6ffEe3ed15fCE55eCA42AcE9736901b94A1': {
    lpChainId: base.id,
    name: 'WETH-OLAS',
    originAddress: '0x2da6e67c45af2aaa539294d9fa27ea50ce4e2c5f',
    dex: DEX.BALANCER.name,
    poolId: '0x2da6e67c45af2aaa539294d9fa27ea50ce4e2c5f0002000000000000000001a3',
    guide: 'weth-olas-via-balancer-on-base',
  },
  // celo
  '0xC085F31E4ca659fF8A17042dDB26f1dcA2fBdAB4': {
    lpChainId: celo.id,
    name: 'CELO-OLAS',
    originAddress: '0x2976Fa805141b467BCBc6334a69AffF4D914d96A',
    dex: DEX.UBESWAP.name,
    poolId: '0x2976fa805141b467bcbc6334a69afff4d914d96a',
    guide: 'celo-olas-via-ubeswap-on-celo',
  },
  // solana
  '0x3685B8cC36B8df09ED9E81C1690100306bF23E04': {
    lpChainId: VM_TYPE.SVM,
    name: 'OLAS-WSOL',
    originAddress: POSITION.toString(),
    dex: DEX.SOLANA.name,
    poolId: ADDRESSES[VM_TYPE.SVM].balancerVault, // whirpool address
    guide: 'wsol-olas-via-orca-on-solana',
  },
};

export const isSvmLpAddress = (address) =>
  areAddressesEqual(address, '0x3685B8cC36B8df09ED9E81C1690100306bF23E04');

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
  const currentLpPairDetails = Object.keys(LP_PAIRS).find((key) => areAddressesEqual(key, address));

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
    console.error('Error fetching token0 and token1 from the LP pair contract: ', address);
  }

  return {
    lpChainId: chainId,
    name: `OLAS${tokenSymbol ? `-${tokenSymbol}` : ''}`,
    originAddress: address,
    dex: DEX.UNISWAP.name,
    poolId: null,
  };
});

/**
 * Fetches the current "price of the LP token" from Balancer
 */
const getCurrentPriceBalancerFn = memoize(async (tokenAddress) => {
  try {
    const { lpChainId, poolId } = await getLpTokenDetails(tokenAddress);

    const { pool } = await BALANCER_GRAPH_CLIENTS[lpChainId].request(balancerGetPoolQuery(poolId));

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
  } catch {
    console.error(`Error getting priceLp from balancer`);
    return 0;
  }
});

/**
 * Fetches the current "price of the LP token" from UniswapV2Pair contract
 */
const getCurrentPriceUniswapFn = memoize(async (tokenAddress) => {
  const chainId = LP_PAIRS[tokenAddress]?.lpChainId;
  if (!chainId) {
    throw new Error(`Chain id not found for provided token address: ${tokenAddress}`);
  }

  const tokenOriginAddress = LP_PAIRS[tokenAddress].originAddress;

  if (!tokenOriginAddress) {
    throw new Error(`Origin address not found for provided token address: ${tokenAddress}`);
  }

  const contract = getUniswapV2PairContractByChain(tokenOriginAddress, chainId);

  const [totalSupply, reserves, token0] = await Promise.all([
    contract.read.totalSupply(),
    contract.read.getReserves(),
    contract.read.token0(),
  ]);

  const [reserve0, reserve1] = reserves;

  const olasTokenAddress = ADDRESSES[chainId].olasAddress;
  const reservesOlas = areAddressesEqual(token0, olasTokenAddress) ? reserve0 : reserve1;
  const priceLp = (reservesOlas * BigInt(10 ** 18)) / totalSupply;
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
  const getCurrentPriceUniswap = useCallback(getCurrentPriceUniswapFn, [getCurrentPriceUniswapFn]);

  return useCallback(
    async (productList) => {
      const chainId = getChainId();
      const svmPriceLp = await getCurrentPriceWhirlpool();
      const multicallRequests = {};
      const otherRequests = {};

      for (let i = 0; i < productList.length; i += 1) {
        if (productList[i].token === ADDRESS_ZERO) {
          otherRequests[i] = 0;
        } else {
          /* eslint-disable-next-line no-await-in-loop */
          const { lpChainId, dex } = await getLpTokenDetails(productList[i].token);

          if (isL1Network(lpChainId)) {
            multicallRequests[i] = {
              address: DEPOSITORY.addresses[chainId],
              abi: DEPOSITORY.abi,
              functionName: 'getCurrentPriceLP',
              args: [productList[i].token],
            };
          } else {
            let currentLpPrice = null;
            if (dex === DEX.UNISWAP.name || dex === DEX.UBESWAP.name) {
              currentLpPrice = getCurrentPriceUniswap(productList[i].token);
              otherRequests[i] = currentLpPrice;
            } else if (dex === DEX.BALANCER.name) {
              currentLpPrice = getCurrentPriceBalancer(productList[i].token);
              otherRequests[i] = currentLpPrice;
            } else if (dex === DEX.SOLANA.name) {
              otherRequests[i] = svmPriceLp;
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
    [publicClient, getCurrentPriceBalancer, getCurrentPriceUniswap, getCurrentPriceWhirlpool],
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
    const tokenAddress = getProductValueFromEvent(productList[i], events, 'token');
    const tokenDetailsPromise = getLpTokenDetails(tokenAddress);
    lpTokenNamePromiseList.push(tokenDetailsPromise);
  }

  const lpTokenDetailsList = await Promise.all(lpTokenNamePromiseList);

  return productList.map((component, index) => {
    const { name, poolId, lpChainId, guide } = lpTokenDetailsList[index];
    const lpLink = getLpLink({
      lpDex: lpTokenDetailsList[index].dex,
      lpChainId,
      lpPoolId: poolId,
      lpAddress: component.token,
    });
    const lpTokenLink = `https://etherscan.io/token/${component.token}`;
    const currentPriceLpLink = getCurrentPriceLpLink({
      lpDex: lpTokenDetailsList[index].dex,
      lpChainId,
      lpAddress: component.token,
    });
    const dexDetails = find(DEX, { name: lpTokenDetailsList[index].dex });

    return {
      ...component,
      lpChainId,
      lpTokenName: name,
      lpLink,
      lpTokenLink,
      currentPriceLpLink,
      guide,
      dexDisplayName: dexDetails.displayName,
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
          window.console.warn(`Product ${product.id} not found in the event list`);
        }

        const eventSupply = Number(ethers.toBigInt(createProductEvent.supply) / ONE_ETH);

        const productSupply = !closeProductEvent
          ? Number(ethers.toBigInt(product.supply) / ONE_ETH)
          : Number(ethers.toBigInt(closeProductEvent.supply) / ONE_ETH);

        const supplyLeft = productSupply / Number(eventSupply);

        const priceLp =
          product.token !== ADDRESS_ZERO ? product.priceLp : createProductEvent?.priceLp || 0;

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
        const currentPriceLpIn = ethers.toBigInt(`${record.currentPriceLp || 0}`);
        const doubledCurrentPriceLp = (currentPriceLpIn * 2n).toString();

        const parsedDoubledCurrentPriceLp =
          parseToEth(doubledCurrentPriceLp) / (isSvmLpAddress(record.token) ? 10 ** 10 : 1);

        const fullCurrentPriceLp = Number(round(parsedDoubledCurrentPriceLp, 2)) || '0';

        // get the discounted OLAS per LP token
        const discountedOlasPerLpTokenInBg = getLpTokenWithDiscount(
          record.priceLp || 0,
          record.discount || 0,
        );

        // parse to eth and round to 2 decimal places
        const roundedDiscountedOlasPerLpToken = round(
          parseToEth(discountedOlasPerLpTokenInBg) / (isSvmLpAddress(record.token) ? 10 ** 10 : 1),
          2,
        );

        // calculate the projected change
        const difference = roundedDiscountedOlasPerLpToken - fullCurrentPriceLp;
        const projectedChange = round((difference / fullCurrentPriceLp) * 100, 2);

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

      const listWithCurrentLpPrice = await addCurrentLpPriceToProducts(productList);

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
    [publicClient, addCurrentLpPriceToProducts, addSupplyLeftToProducts, addProjectedChange],
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
