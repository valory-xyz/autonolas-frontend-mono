import { Address } from 'viem';
import { base, gnosis } from 'wagmi/chains';

export const MECH_MARKETPLACE_ADDRESSES: Record<number, Address> = {
  [gnosis.id]: '0x735FAAb1c4Ec41128c367AFb5c3baC73509f70bB',
  [base.id]: '0xf24eE42edA0fc9b33B7D41B06Ee8ccD2Ef7C5020',
};
