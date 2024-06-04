import { toLower } from 'lodash';

import prohibitedAddresses from 'libs/util-prohibited-data/src/lib/prohibited-addresses.json';

export const isAddressProhibited = (address: `0x${string}` | undefined) => {
  const addresses = prohibitedAddresses.map((e) => toLower(e));
  return addresses.includes(toLower(address));
};