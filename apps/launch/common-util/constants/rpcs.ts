import { RPC_URLS } from 'libs/util-constants/src';

export type SupportedChain = 1 | 100 | 137; // TODO: make it dynamic

export const LAUNCH_RPC_URLS: Record<number, string> = {
  1: RPC_URLS[1],
  100: RPC_URLS[100],
  137: RPC_URLS[137],
};
