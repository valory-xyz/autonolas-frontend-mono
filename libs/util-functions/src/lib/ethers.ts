import { BigNumberish, ethers, formatEther } from 'ethers';
import toLower from 'lodash/toLower';
import { Address } from 'viem';

export const getAddressFromBytes32 = (address: Address | string) => {
  return ('0x' + address.slice(-40)) as Address;
};

export const getBytes32FromAddress = (address: Address | string) => {
  return ethers.zeroPadValue(address, 32) as Address;
};

export const isValidAddress = (address: string) => ethers.isAddress(address);

export const areAddressesEqual = (a1: string | Address, a2: string | Address) =>
  toLower(a1) === toLower(a2);

/**
 * Same as `formatToEth` but doesn't fixes the decimal to 8
 * @returns {String} eg: 1000000000000000000 => 1
 */
export const parseToEth = (amount: string) => (amount ? formatEther(`${amount}`) : 0);

/**
 * Converts wei to ETH
 * @param value - The value in wei to convert
 * @returns The value in ETH as a string
 */
export const convertToEth = (value: BigNumberish): string => {
  if (!value) return '0';
  return formatEther(value);
};
