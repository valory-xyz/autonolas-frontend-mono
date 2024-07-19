import { ethers } from 'ethers';
import { Address } from 'viem';

export const getAddressFromBytes32 = (address: Address | string) => {
  return ('0x' + address.slice(-40)) as Address;
};

export const getBytes32FromAddress = (address: Address | string) => {
  return ethers.zeroPadValue(address, 32) as Address;
};

export const truncateAddress = (address: Address | string) =>
  address ? `${address.substring(0, 7)}...${address.substring(address.length - 5)}` : '--';
