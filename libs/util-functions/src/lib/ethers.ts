import { ethers } from 'ethers';
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
