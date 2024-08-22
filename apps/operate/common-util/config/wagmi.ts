import { createConfig, http } from 'wagmi';
import { Chain, mainnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet];

export const RPC_URLS: Record<number, string> = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL ?? mainnet.rpcUrls.default.http[0],
};

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
});
