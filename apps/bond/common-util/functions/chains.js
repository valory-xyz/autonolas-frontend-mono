import { LOCAL_FORK_ID } from '@autonolas/frontend-library';

export const isL1Network = (chainId) =>
  chainId === 1 || chainId === 5 || chainId === LOCAL_FORK_ID;
