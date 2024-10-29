import { ethers } from 'ethers';
import { gql } from 'graphql-request';
import { isNumber, isString, memoize } from 'lodash';
import { celo } from 'viem/chains';

import { VM_TYPE, notifyError } from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/constants/addresses';
import { ADDRESS_ZERO } from 'common-util/constants/numbers';
import { DEX } from 'common-util/enums';
import { AUTONOLAS_GRAPH_CLIENTS } from 'common-util/graphql/clients';

export const getProductValueFromEvent = (product, events, keyName) => {
  if ((events || []).length === 0) {
    return product[keyName];
  }

  if (product.token !== ADDRESS_ZERO) {
    return product[keyName];
  }

  const event = events?.find((e) => e?.productId === `${product.id}`);
  if (!event) notifyError('Product not found in the event list');
  return event[keyName];
};

/**
 *
 * @param {Number | String} lpTokenValue
 * @param {Number | String} discount
 */
export const getLpTokenWithDiscount = (lpTokenValue, discount) => {
  const priceInBn = ethers.toBigInt(lpTokenValue);
  const discountInBn = ethers.toBigInt(discount);
  const discountedPriceInBg = priceInBn + (priceInBn * discountInBn) / 100n;
  return discountedPriceInBg;
};

/**
 *
 * @param {Number | String} reserveOlas
 * @param {Number | String} totalSupply
 */
export const getSvmCalculatedPriceLp = (reserveOlas, totalSupply) => {
  const reserveOlasInBn =
    isNumber(reserveOlas) || isString(reserveOlas)
      ? ethers.toBigInt(reserveOlas.toString())
      : reserveOlas;
  const totalSupplyInBn =
    isNumber(totalSupply) || isString(totalSupply)
      ? ethers.toBigInt(totalSupply.toString())
      : totalSupply;
  const multiplier = ethers.toBigInt(`1${'0'.repeat(28)}`);

  const priceLp = ((reserveOlasInBn * multiplier) / totalSupplyInBn).toString();
  return priceLp;
};

/**
 * Function to get the link to the LP token
 */
export const getLpLink = ({ lpDex, lpChainId, lpPoolId, lpAddress }) => {
  if (lpChainId === celo.id) {
    return `https://info-v2.ubeswap.org/pair/${lpPoolId}`;
  }

  if (lpDex === DEX.UNISWAP) {
    return `https://v2.info.uniswap.org/pair/${lpAddress}`;
  }

  if (lpDex === DEX.BALANCER) {
    if (lpChainId === 100) {
      return `https://app.balancer.fi/#/gnosis-chain/pool/${lpPoolId}`;
    }

    if (lpChainId === 137) {
      return `https://app.balancer.fi/#/polygon/pool/${lpPoolId}`;
    }

    if (lpChainId === 42161) {
      return `https://app.balancer.fi/#/arbitrum/pool/${lpPoolId}`;
    }

    if (lpChainId === 10) {
      return `https://app.balancer.fi/#/optimism/pool/${lpPoolId}`;
    }

    if (lpChainId === 8453) {
      return `https://app.balancer.fi/#/base/pool/${lpPoolId}`;
    }
  }

  if (lpDex === DEX.SOLANA) {
    return `https://v1.orca.so/liquidity/browse?tokenMint=${
      ADDRESSES[VM_TYPE.SVM].olasAddress
    }&tokenMint=${ADDRESSES[VM_TYPE.SVM].wsolAddress}`;
  }

  return new Error('Dex not supported');
};

/**
 * Function to get the exchange link for the LP token
 */
export const getCurrentPriceLpLink = ({ lpDex, lpChainId, lpAddress }) => {
  if (lpChainId === celo.id) {
    return `https://celoscan.io/address/${lpAddress}#readContract#F8`;
  }

  if (lpDex === DEX.UNISWAP) {
    const depositoryAddress = ADDRESSES[lpChainId].depository;
    return `https://etherscan.io/address/${depositoryAddress}#readContract#F7`;
  }

  if (lpDex === DEX.BALANCER) {
    if (lpChainId === 100) {
      return `https://gnosisscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 137) {
      return `https://polygonscan.com/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 42161) {
      return `https://arbiscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 10) {
      return `https://optimistic.etherscan.io/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }

    if (lpChainId === 8453) {
      return `https://basescan.org/address/${ADDRESSES[lpChainId].balancerVault}#readContract#F10`;
    }
  }

  if (lpDex === DEX.SOLANA) {
    return `https://solscan.io/account/${ADDRESSES[lpChainId].balancerVault}`;
  }

  return new Error('Dex not supported');
};

const getCreateProductEventsFn = async () => {
  const graphQLClient = AUTONOLAS_GRAPH_CLIENTS[1];

  const query = gql`
    query GetCreateProducts {
      createProducts(first: 1000) {
        productId
        token
        priceLP
        supply
        vesting
      }
    }
  `;

  const res = await graphQLClient.request(query);
  return res.createProducts;
};
/**
 * function to get the create product events
 */
export const getCreateProductEvents = memoize(getCreateProductEventsFn);

const getCloseProductEventsFn = async () => {
  const graphQLClient = AUTONOLAS_GRAPH_CLIENTS[1];

  const query = gql`
    query GetCloseProducts {
      closeProducts(first: 1000) {
        productId
        token
        supply
      }
    }
  `;

  const res = await graphQLClient.request(query);
  return res.closeProducts;
};
/**
 * function to get the close product events
 */
export const getCloseProductEvents = memoize(getCloseProductEventsFn);
