import { base, gnosis } from 'wagmi/chains';

export type Network = (typeof gnosis)['id'] | (typeof base)['id'];
