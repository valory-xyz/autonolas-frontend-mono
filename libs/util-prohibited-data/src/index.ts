import { toLower } from 'lodash';

import prohibitedAddresses from './lib/prohibited-addresses.json';

type Address = `0x${string}`;

export const isAddressProhibited = (address: Address | undefined) => {
  const addresses = prohibitedAddresses.map((e) => toLower(e));
  return addresses.includes(toLower(address));
};
