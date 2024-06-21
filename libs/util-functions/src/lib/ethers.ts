import { ethers } from 'ethers';
import { Address } from 'viem';

export const getBytes32FromAddress = (address: Address | string) => {
  return ethers.zeroPadValue(address, 32) as Address;
};
