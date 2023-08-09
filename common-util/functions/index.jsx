import { ethers } from 'ethers';
import dayjs from 'dayjs';
import { notification } from 'antd/lib';
import { isNil, isString } from 'lodash';
import { COLOR } from 'util/theme';
import { GATEWAY_URL, TOTAL_VIEW_COUNT } from 'util/constants';
import { NA } from 'common-util/constants';
import { ADDRESSES } from 'common-util/Contracts';

/**
 * https://docs.ethers.org/v5/api/utils/constants/#constants-MaxUint256
 */
export const MAX_AMOUNT = ethers.constants.MaxUint256;

export const getBalance = (account, p) => new Promise((resolve, reject) => {
  p.eth
    .getBalance(account)
    .then((balance) => {
      const balanceInEth = ethers.utils.formatEther(balance);
      resolve(balanceInEth);
    })
    .catch((e) => {
      reject(e);
    });
});

/**
 *
 * @param {BigNumebr} value value to be converted to Eth
 * @param {Number} dv Default value to be returned
 * @returns {String} with 2 decimal places
 */
export const formatToEth = (value, dv = 0) => {
  if (isNil(value)) return dv || 0;
  return (+ethers.utils.formatEther(value)).toFixed(2);
};

/**
 * Same as `formatToEth` but doesn't fixes the decimal to 8
 * @returns {String} eg: 1000000000000000000 => 1
 */
export const parseToEth = (amount) => (amount ? ethers.utils.formatEther(`${amount}`) : 0);

/**
 * multiplies the amount by 10^18
 */
export const parseToWei = (amount) => ethers.utils.parseUnits(`${amount}`, 18).toString();

/**
 * parse eth to wei
 * example 1 => 1000000000000000000
 */
export const parseEther = (n) => ethers.utils.parseEther(`${n}`);

export const getBlockTimestamp = async (block = 'latest') => {
  const temp = await window?.WEB3_PROVIDER.eth.getBlock(block);
  return temp.timestamp * 1;
};

export const notifyError = (message = 'Some error occured') => notification.error({
  message,
  style: { border: `1px solid ${COLOR.PRIMARY}` },
});

export const notifySuccess = (message = 'Successfull', description = null) => notification.success({
  message,
  description,
  style: { border: `1px solid ${COLOR.PRIMARY}` },
});

/**
 * Converts a number to a compact format
 * @param {Number} x
 * @returns {String} eg: 1000000 => 1M, 12345.67 => 12.35K
 */
export const getFormattedNumber = (x) => {
  if (isNil(x)) return '0';

  // if < 9999 then show 2 decimal places with comma
  // if (x < 9999) return x.toLocaleString('en', { maximumFractionDigits: 2 });

  return new Intl.NumberFormat('en', {
    notation: 'compact',
    minimumFractionDigits: 0,
    // maximumFractionDigits: 5,
  }).format(x);
};

/**
 * Converts a number to a comma separated format
 * @param {Number} x
 * @returns {String} eg: 1000000 => 1,000,000, 12345.67 => 12,345.67
 */
export const getCommaSeparatedNumber = (x) => {
  if (isNil(x) || Number(x) === 0) return '0.0';

  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
  }).format(x);
};

/**
 * converts to percentage and returns a string with 2 decimal places
 */
export const getTotalVotesPercentage = (votes, totalSupply) => {
  if (votes && totalSupply) {
    const votesInEth = Number(parseToEth(votes));
    const totalSupplyInEth = Number(parseToEth(totalSupply));
    const votingPowerInPercentage = (
      (votesInEth / totalSupplyInEth)
      * 100
    ).toFixed(2);

    return getFormattedNumber(votingPowerInPercentage);
  }

  return null;
};

/**
 * Get formatted date from milliseconds
 * example, 1678320000000 => Mar 09 '23
 */
export const getFormattedDate = (ms) => {
  if (!ms) return NA;
  return dayjs(ms).format("MMM DD 'YY");
};

/**
 * Get formatted date from milliseconds including time
 * example, 1678320000000 => Mar 09 '2023 16:00
 */
export const getFullFormattedDate = (ms) => {
  if (!ms) return NA;
  return dayjs(ms).format("MMM DD 'YYYY, HH:mm");
};

export const getString = (x) => {
  if (isNil(x)) return NA;
  return isString(x) ? x : `${x}`;
};

export const convertToEth = (value) => ethers.utils.formatEther(value);

/**
 * @example
 * TOTAL_VIEW_COUNT = 10
 * nextPage = 5
 * total = 45
 * first = ((5 - 1) * 10) + 1
 *      = (4 * 10) + 1
 *      = 41
 * last = min(5 * 10, 45)
 *      = 45
 */
export const getFirstAndLastIndex = (total, nextPage) => {
  let first = 1;
  if (nextPage !== 1) {
    first = (nextPage - 1) * TOTAL_VIEW_COUNT + 1;
  }
  const last = Math.min(nextPage * TOTAL_VIEW_COUNT, total);
  return { first, last };
};

// Nofitications

export const safeSendTransactionNotification = () => notification.warning({
  message: 'Please submit the transaction in your safe app.',
});

export const getSupportedNetworks = () => Object.keys(ADDRESSES).map((e) => Number(e));

export const getIpfsResponse = async (hash) => {
  try {
    const ipfsUrl = `${GATEWAY_URL}f01701220${hash.substring(2)}`;
    const response = await fetch(ipfsUrl);
    const json = await response.json();
    return json;
  } catch (e) {
    window.console.error('Error fetching metadata from IPFS', e);
    throw new Error(e);
  }
};

// show last element of agentHashes array
export const getAgentHash = (agentHashes = []) => (agentHashes.length === 0 ? '' : agentHashes[agentHashes.length - 1]);
