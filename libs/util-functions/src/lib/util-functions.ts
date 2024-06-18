import { Address } from 'viem';

export const truncateAddress = (address: Address | string) =>
  address ? `${address.substring(0, 7)}...${address.substring(address.length - 5)}` : '--';
