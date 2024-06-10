import { ethers } from 'ethers';

import prohibitedAddresses from 'libs/util-prohibited-data/src/lib/prohibited-addresses.json';
import { toLower } from 'lodash';

export const isAddressProhibited = (address: `0x${string}` | undefined) => {
  const addresses = prohibitedAddresses.map((e) => toLower(e));
  return addresses.includes(toLower(address));
};

export const getAddressFromBytes32 = (address: `0x${string}` | string) => {
  return ('0x' + address.slice(-40)) as `0x${string}`;
};

export const getBytes32FromAddress = (address: `0x${string}` | string) => {
  return ethers.zeroPadValue(address, 32) as `0x${string}`;
};
