import { Abi, Address } from 'viem';
import { base, mainnet } from 'wagmi/chains';

import {
  CONTRIBUTORS_V2_ABI,
  CONTRIBUTORS_V2_ADDRESS_BASE,
  DELEGATE_CONTRIBUTE_ABI,
  DELEGATE_CONTRIBUTE_ADDRESS_MAINNET,
  MINT_NFT_CONTRACT_ABI_GOERLI,
  MINT_NFT_CONTRACT_ABI_MAINNET,
  MINT_NFT_CONTRACT_ADDRESS_GOERLI,
  MINT_NFT_CONTRACT_ADDRESS_MAINNET,
  VEOLAS_ABI,
  VEOLAS_ADDRESS_MAINNET,
} from 'common-util/AbiAndAddresses';

// `chainId` is widened to `number` (rather than the literal `1` / `8453`) so
// wagmi's simulate/write/wait overloads accept it against the workspace's
// non-const wagmi chains tuple. Address and abi stay as their literal types
// for viem to keep type inference on read/write returns.

// Mainnet
export const delegateContributeParams = {
  address: DELEGATE_CONTRIBUTE_ADDRESS_MAINNET as Address,
  abi: DELEGATE_CONTRIBUTE_ABI,
  chainId: mainnet.id as number,
};

export const veolasParams = {
  address: VEOLAS_ADDRESS_MAINNET as Address,
  abi: VEOLAS_ABI,
  chainId: mainnet.id as number,
};

// Base
export const contributorsParams = {
  address: CONTRIBUTORS_V2_ADDRESS_BASE as Address,
  abi: CONTRIBUTORS_V2_ABI,
  chainId: base.id as number,
};

// Mint NFT contract — different ABI/address per chain.
// The mint NFT ABI modules are .tsx without `as const`, so viem can't infer types;
// `Abi` cast is required and reads must be cast manually.
type MintNftParams = { address: Address; abi: Abi; chainId: number };

export const mintNftParams = (chainId: number): MintNftParams | null => {
  if (chainId === mainnet.id) {
    return {
      address: MINT_NFT_CONTRACT_ADDRESS_MAINNET as Address,
      abi: MINT_NFT_CONTRACT_ABI_MAINNET as Abi,
      chainId,
    };
  }
  if (chainId === 5 /* Goerli */) {
    return {
      address: MINT_NFT_CONTRACT_ADDRESS_GOERLI as Address,
      abi: MINT_NFT_CONTRACT_ABI_GOERLI as Abi,
      chainId,
    };
  }
  return null;
};
