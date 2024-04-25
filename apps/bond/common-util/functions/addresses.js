import toLower from 'lodash/toLower';
import prohibitedAddresses from '../../data/prohibited-addresses.json';

export const isAddressProhibited = (address) => {
  const addresses = prohibitedAddresses.map((e) => toLower(e));
  return addresses.includes(toLower(address));
};
