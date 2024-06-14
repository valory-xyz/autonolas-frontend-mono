import { ethers } from 'ethers';
import { toLower } from 'lodash';

import prohibitedAddresses from 'libs/util-prohibited-data/src/lib/prohibited-addresses.json';

import { Address } from 'types/index';

export const isAddressProhibited = (address: Address | undefined) => {
  const addresses = prohibitedAddresses.map((e) => toLower(e));
  return addresses.includes(toLower(address));
};

export const getAddressFromBytes32 = (address: Address | string) => {
  return ('0x' + address.slice(-40)) as Address;
};

export const getBytes32FromAddress = (address: Address | string) => {
  return ethers.zeroPadValue(address, 32) as Address;
};

export const truncateAddress = (address: Address | string) =>
  address ? `${address.substring(0, 7)}...${address.substring(address.length - 5)}` : '--';
