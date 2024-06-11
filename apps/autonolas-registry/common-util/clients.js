import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const publicClients = {
    1: createPublicClient({
        transport: http(process.env.NEXT_PUBLIC_MAINNET_URL),
        chain: mainnet,
    }),
}