import { utils } from 'ethers';

/**
 * Same as `formatToEth` but doesn't fixes the decimal to 8
 * @returns {String} eg: 1000000000000000000 => 1
 */
export const parseToEth = (amount) =>
  amount ? utils.formatEther(`${amount}`) : 0;

/**
 * multiplies the amount by 10^18
 */
export const parseToWei = (amount) =>
  utils.parseUnits(`${amount}`, 18).toString();

/**
 * multiplies the amount by 10^8
 */
export const parseToSolDecimals = (amount) =>
  utils.parseUnits(`${amount}`, 8).toString();

/**
 * TODO: move to autonolas-library and figure out a better way
 * to fetch timestamp
 */
export const getBlockTimestamp = async (block = 'latest') => {
  const temp = await window?.WEB3_PROVIDER.eth.getBlock(block);
  return temp.timestamp * 1;
};
