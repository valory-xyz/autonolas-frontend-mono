import { toLower } from 'lodash';
import { Address } from 'viem';

import prohibitedAddresses from './lib/prohibited-addresses.json';

export const isAddressProhibited = (address: Address | undefined) => {
  const addresses = prohibitedAddresses.map((e) => toLower(e));
  return addresses.includes(toLower(address));
};
