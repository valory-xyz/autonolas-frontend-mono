import type { RpcUrl } from 'libs/util-functions/src/lib/sendTransaction/types';

export const RPC_URLS: RpcUrl = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL as string,
};
